const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const creditSchema = new Schema(
  {
    balance: { type: Number, default: 0 },
    lock: String
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = DB => DB.model("Credit", creditSchema);
