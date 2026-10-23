import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function listAssignable(user) {
  if (user.role !== 'admin') return [{ _id: user._id, name: user.name, role: user.role }];
  return User.find({ isActive: true }).select('name role').sort({ name: 1 }).lean();
}

export async function listUsers() {
  const [users, counts] = await Promise.all([
    User.find().sort({ role: 1, name: 1 }),
    Lead.aggregate([{ $group: { _id: '$assignedTo', count: { $sum: 1 } } }]),
  ]);
  const byUser = new Map(counts.map((c) => [String(c._id), c.count]));
  return users.map((u) => ({ ...u.toJSON(), leadCount: byUser.get(u.id) ?? 0 }));
}

export async function createUser({ password, ...data }) {
  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('A user with that email already exists', [
      { field: 'email', message: 'Email is already in use' },
    ]);
  }
  return User.create({ ...data, passwordHash: await User.hashPassword(password) });
}

export async function setUserStatus(actor, id, isActive) {
  if (String(actor._id) === id && !isActive) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
