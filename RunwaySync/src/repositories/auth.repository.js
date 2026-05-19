import User from '../models/User.model.js';

export const findUserByEmail = (email) => {
  return User.findOne({ email });
};

export const saveResetCode = (user, code, expires) => {
  user.resetCode = code;
  user.resetCodeExpires = expires;
  return user.save();
};

export const updatePassword = async (user, hashedPassword) => {
  user.password = hashedPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  return user.save();
};