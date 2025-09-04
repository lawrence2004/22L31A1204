import mongoose from "mongoose";

const ClickSchema = new mongoose.Schema(
  {
    ts: { type: Date, default: Date.now },     
    referrer: String,  
    ip: String,                              
    ua: String                            
  },
  { _id: false }
);

const ShortUrlSchema = new mongoose.Schema(
  {
    shortcode: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    clicks: { type: Number, default: 0 },
    clickLog: { type: [ClickSchema], default: [] }
  },
  { versionKey: false }
);

export default mongoose.model("ShortUrl", ShortUrlSchema);
