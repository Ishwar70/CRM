import { User } from '../models/User.js';

export async function listAssignable(user) {
  if (user.role !== 'admin') return [{ _id: user._id, name: user.name, role: user.role }];
  return User.find({ isActive: true }).select('name role').sort({ name: 1 }).lean();
}
