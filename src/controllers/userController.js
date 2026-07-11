const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse } = require('../utils/helpers');
const userFactory = require('./factories/userFactory');
const logger = require('../logger')('USER_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const User = require('../models/userModel');
const Joi = require('joi');
const sendContactEmail = require('../utils/mails/sendContactEmail');
const Customer = require('../models/customerModel');
const Inventory = require('../models/inventoryModel');
const Installment = require('../models/installmentModel.js');
const Sale = require('../models/saleModel');
const dayjs = require('dayjs');
const Payment = require('../models/paymentModel');

exports.adminLogin = userFactory.adminLogin();
exports.adminUserRegister = userFactory.adminRegisterUser();
exports.userLogin = userFactory.adminLogin();
exports.googleLogin = userFactory.googleLogin();
exports.appleLogin = userFactory.appleLogin();
exports.register = userFactory.registerUser();
exports.verifyOtp = userFactory.verifyOtp();
exports.resendOtp = userFactory.resendOtp();
exports.getProfile = userFactory.profile();
exports.updatePassword = userFactory.updatePassword();
exports.forgotPassword = userFactory.forgotPassword();
exports.resetPassword = userFactory.resetPassword();
exports.saveFcmToken = userFactory.saveFcmToken();
exports.logout = userFactory.logout();



exports.getAllUsers = catchAsync(async(req , res ,next) => {
    const query = { isSuperAdmin : false,role:null };
    handlerFactory.getAll(User , '' , logger , query)(req , res , next)
});
exports.getAllAdminUsers = catchAsync(async(req , res ,next) => {
    const query = { isSuperAdmin : false,role: { $ne: null } };
    handlerFactory.getAll(User , "role" , logger , query)(req , res , next)
});

exports.getSingleUser = handlerFactory.getOne(User , '' , logger);
exports.updateUser = handlerFactory.updateOne(User , logger);
exports.deleteUser  = handlerFactory.deleteOne(User , logger);


const updateProfileValidations = Joi.object({
    country: Joi.string().optional(),    
    gender: Joi.string()
        .valid('male', 'female', 'other')
        .optional(), 
    dateOfBirth: Joi.string().optional()
}).strict();

exports.updateProfile = catchAsync(async(req , res , next) => {
    const user = req.user;
    const { error } = updateProfileValidations.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }

    if(req.file) {
        req.body.image = req.file.location
    }

    const updatedUser = await User.findByIdAndUpdate(user?._id , req.body , {
        runValidators : true ,
        new : true 
    }).select('-password');

    sendSuccessResponse(res , 200 , logger , {
        message : "Profile updated successfully." ,
        doc : updatedUser
    })
});

exports.sendContactEmail = catchAsync(async(req , res , next) => {
    // const { error } = contactValidations.validate(req.body);
    // if(error) {
    //     return next(new AppError(error.details[0].message , 400))
    // }

    try {
        const resp = await sendContactEmail(req.body);
        sendSuccessResponse(res , 200 , logger , {
            message : 'Message sent successfully.'
        })
    } catch (error) {
        console.log({ error })
        return next(new AppError('Somehting went wrong.' , 500))
    }
})


exports.deleteMyAccount = catchAsync(async(req , res , next) => {
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId , { status : 'deleted'});
    sendSuccessResponse(res , 200 , logger , {
        message : 'Your account deactivated successfully.'
    })
})


exports.dashboardStats = catchAsync(async(req , res , next) => {
    const { period, start, end } = req.query;
     const { from, to } = resolveRange({ period, start, end });

  // A) Basic counts (global – not date-filtered)
const inventoryStats = await Inventory.aggregate([
  {
    $facet: {
      totalActiveInventory: [
        { $match: { status: { $nin: ['deleted'] } }},
        { $count: "count" }
      ],
      availableForBooking: [
        { $match: { status: "not_assigned" }},
        { $count: "count" }
      ],
      onInstallments: [
        { $match: { status: { $in: ['assigned', 'in_installment'] }}},
        { $count: "count" }
      ],
      paymentCompletedInventories: [
        { $match: { status: { $in: ['full_paid', 'hand_over'] }}},
        { $count: "count" }
      ]
    }
  }
]);

// Extract values (Mongo returns arrays)
function getCount(key) {
  return inventoryStats[0][key]?.[0]?.count || 0;
}

const totalActiveInventory       = getCount("totalActiveInventory");
const availableForBooking        = getCount("availableForBooking");
const onInstallmentsInventories             = getCount("onInstallments");
const paymentCompletedInventories= getCount("paymentCompletedInventories");

// Total customers can be counted separately (different collection)
const totalCustomers = await Customer.countDocuments({status: { $ne: 'deleted' }});
const pendingPaymentsForApproval =  await   Payment.countDocuments({ status: 'pending', createdAt: { $gte: from, $lte: to } });


  // B) Filter installments by date & status
  //
  // We consider:
  //  - paid receipts: status = 'paid'   AND paidAt within range
  //  - pending receipts: status in ['scheduled','overdue'] AND dueDate within range
  //
  const matchStage = {
    $or: [
      // Paid ones in this window
      { status: 'paid', paidAt: { $gte: from, $lte: to } },
      // Pending/overdue ones whose dueDate is in this window
      {
        status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] },
        dueDate: { $gte: from, $lte: to }
      }
    ]
  };

  const installmentStats = await Installment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  const byStatus = installmentStats.reduce((acc, row) => {
    acc[row._id] = { count: row.count, amount: row.amount };
    return acc;
  }, {});

  const paid = byStatus['paid'] || { count: 0, amount: 0 };
  const scheduled = byStatus['un-paid'] || { count: 0, amount: 0 };
  const overdue = byStatus['overdue'] || { count: 0, amount: 0 };

  // Pending = scheduled + overdue
  const pendingCount = scheduled.count + overdue.count;
  const pendingAmount = scheduled.amount + overdue.amount;

  const totalReceiptsCount = paid.count + pendingCount;
  const totalReceiptsAmount = paid.amount + pendingAmount;

  // C) Prepare response matching your UI cards
  const data= {
    range: {
      period,
      from,
      to
    },

    headline: {
      totalCustomers,
      totalActiveInventory,
        availableForBooking,
        onInstallmentsInventories:onInstallmentsInventories,
        paymentCompletedInventories,
      paidInstallments: paid.count,
      pendingInstallments: pendingCount,
      pendingPaymentsForApproval
    },

    installments: {
      totalInstallmentsCount:totalReceiptsCount,
      totalInstallmentsAmount:totalReceiptsAmount,

      paid: {
        count: paid.count,
        amount: paid.amount
      },
      overdue: {
        count: overdue.count,
        amount: overdue.amount
      },
      unpaid: {
        // unpaid = scheduled + overdue
        count: scheduled.count + overdue.count,
        amount: scheduled.amount + overdue.amount
      }
    }
  };


    sendSuccessResponse(res , 200 , logger , {
        ...data
    })
})





exports.getInventorySalesSeries  = catchAsync(async(req , res , next) => {
    const { period, start, end } = req.query;
    const { from, to } = resolveRange({ period, start, end });

  // group sales (bookings) by month
  const raw = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        status: { $nin: ['cancelled', 'transferred'] } // treat others as valid sales
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        amount: { $sum: '$sellingPrice' } // optional: total sale value
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Map to year-month string -> data
  const map = new Map();
  raw.forEach(row => {
    const ym = `${row._id.year}-${String(row._id.month).padStart(2,'0')}`;
    map.set(ym, { count: row.count, amount: row.amount });
  });

  // Build continuous month list between from..to (for chart gaps = 0)
  const buckets = [];
  let cursor = dayjs(from).startOf('month');
  const endMonth = dayjs(to).startOf('month');

  while (cursor.isSame(endMonth) || cursor.isBefore(endMonth)) {
    const ym = `${cursor.year()}-${String(cursor.month() + 1).padStart(2,'0')}`;
    const monthName = cursor.format('MMM'); // Jan, Feb, ...

    const entry = map.get(ym) || { count: 0, amount: 0 };
    buckets.push({
      key: ym,
      label: monthName,
      year: cursor.year(),
      month: cursor.month() + 1,
      totalSold: entry.count,
      totalAmount: entry.amount
    });

    cursor = cursor.add(1, 'month');
  }

  const data= {
    range: { period, from, to },
    buckets
  };


    sendSuccessResponse(res , 200 , logger , {
        ...data
    })
})

function resolveRange({ period, start, end }) {
  const today = dayjs().startOf('day');

  let from;
  let to = today.endOf('day');

  switch (period) {
    case 'this_week':
      from = today.startOf('week'); // week start based on locale
      break;
    case 'this_month':
      from = today.startOf('month');
      break;
    case 'last_6_months':
      from = today.subtract(6, 'month').startOf('day');
      break;
    case 'this_year':
      from = today.startOf('year');
      break;
    case 'custom':
      if (!start || !end) {
        throw new Error('start and end are required for custom period');
      }
      from = dayjs(start).startOf('day');
      to = dayjs(end).endOf('day');
      break;
    default:
      // default = this_week
      from = today.startOf('week');
  }

  return { from: from.toDate(), to: to.toDate() };
}