exports.replacePlaceholders = (text = "", payload = {}) => {
  let output = String(text || "");

  Object.entries(payload).forEach(([key, value]) => {
    const safeValue =
      value === null || typeof value === "undefined" ? "" : String(value);

    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\[${escapedKey}\\]`, "g");

    output = output.replace(regex, safeValue);
  });

  return output;
};