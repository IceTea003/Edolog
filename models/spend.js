import mongoose from "mongoose";

const SpendSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        sector: { type: String, required: true },
        amount: { type: Number, required: true },
        note: { type: String },
        date: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model("Spend", SpendSchema);
