import mongoose from 'mongoose';

export const LEAD_SOURCES = ['website', 'referral', 'linkedin', 'other'];
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];
export const LEAD_PRIORITIES = ['low', 'medium', 'high'];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    company: { type: String, trim: true, maxlength: 120 },
    source: { type: String, enum: LEAD_SOURCES, default: 'other' },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'medium' },
    estimatedValue: { type: Number, min: 0 },
    notes: { type: String, maxlength: 2000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.models.Lead ?? mongoose.model('Lead', leadSchema);
