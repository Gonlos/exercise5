const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    uuidLock: String,
    destination: String,
    message: String,
    state: {
      delivery: {
        type: String,
        enum: ["not_confirmed", "not_sent", "confirmed"],
        default: "not_confirmed"
      },
      payment: {
        type: String,
        enum: ["not_confirmed", "not_payed", "confirmed"],
        default: "not_confirmed"
      }
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
