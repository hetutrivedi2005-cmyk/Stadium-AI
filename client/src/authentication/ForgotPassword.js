import { AuthContext } from '../context/AuthContext.js';

export class ForgotPasswordController {
  static async submit(email) {
    if (!email) {
      throw new Error("Please enter your registered email address.");
    }
    return await AuthContext.resetPassword(email.trim());
  }
}
