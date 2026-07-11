const APP_NAME = 'The Prestige';
const APP_SHORT_NAME = 'WAJ';

const CUSTOMER_PARTNER_TYPES = ["joint", "next_of_kin"];
const DOCUMENT_ASSIGN_TYPES = ["customer", "inventory"];
const CUSTOMER_RELATION_TYPES = [
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Grandson",
  "Granddaughter",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "other"
];
const DOCUMENT_TYPES = [
  "cnic",
  "passport",
  "driving_license",
  "utility_bill",
  "picture",
  "application_form",
  "reference_letter",
  "payment_receipt",
  "payment_plan",
  "booking_form",
  "sale_agreement",
  "purchase_agreement",
  "allotment_letter",
  "intimation_letter",
  "transfer_letter",
  "noc",
  "ownership_letter",
  "other"
];
 
const INSTALLMENT_TYPE = [
  'full_payment','down_payment', 'allocation', 'confirmation', 'possession',
  'regular', 'balloon','quarterly','monthly','monthly_balloon'
];
const INSTALLMENT_STATUS = ['un-paid', 'paid', 'overdue', 'defaulted', 'waived','pertially_paid'];

const INVENTORY_TYPES = [
  "residential", "commercial","appartment"
];
const OWNERSHIP_TYPES = [
  "self",
  "joint",
];
const PAYMENT_TYPES = [
  "full_payment",
  "installment",
];
const SALE_STATUS = [
 'draft', 'active', 'completed', 'cancelled', 'defaulted','transferred'
];


//Prefixes for auto increment IDs
const PREFIX_PROJECT_AUTOINCREMENTID = `PT-${APP_SHORT_NAME}-`;
const PREFIX_SECTOR_AUTOINCREMENTID = `SE-${APP_SHORT_NAME}-`;
const PREFIX_INVENTORY_AUTOINCREMENTID = `INV-${APP_SHORT_NAME}-`;
const PREFIX_CUSTOMER_AUTOINCREMENTID = `${APP_SHORT_NAME}`;
const PREFIX_JOINT_AUTOINCREMENTID = `JT-${APP_SHORT_NAME}-`;
const PREFIX_KIN_AUTOINCREMENTID = `KIN-${APP_SHORT_NAME}-`;
const PREFIX_INSTALLMENT_AUTOINCREMENTID = `INST-${APP_SHORT_NAME}-`;
const PREFIX_RECEIPT_AUTOINCREMENTID = `IN-${APP_SHORT_NAME}-`;
const PREFIX_DOCUMENT_AUTOINCREMENTID = `DOC-${APP_SHORT_NAME}-`;

const NUMBERS_DIR = "numbers";


module.exports = {
    APP_NAME, APP_SHORT_NAME,
    PREFIX_PROJECT_AUTOINCREMENTID,
    PREFIX_SECTOR_AUTOINCREMENTID, PREFIX_RECEIPT_AUTOINCREMENTID,
    PREFIX_INVENTORY_AUTOINCREMENTID, PREFIX_CUSTOMER_AUTOINCREMENTID,
    PREFIX_INSTALLMENT_AUTOINCREMENTID,
    PREFIX_DOCUMENT_AUTOINCREMENTID,
    CUSTOMER_PARTNER_TYPES,
    CUSTOMER_RELATION_TYPES,
    DOCUMENT_TYPES,
    DOCUMENT_ASSIGN_TYPES,
    INVENTORY_TYPES,
    PREFIX_JOINT_AUTOINCREMENTID,
    PREFIX_KIN_AUTOINCREMENTID,
    SALE_STATUS,
    INSTALLMENT_TYPE,
    INSTALLMENT_STATUS ,
    OWNERSHIP_TYPES,
    PAYMENT_TYPES,
    NUMBERS_DIR

};