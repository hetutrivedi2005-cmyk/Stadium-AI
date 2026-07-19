import { AuthContext } from '../context/AuthContext.js';

export class LoginController {
  static async submit(email, password) {
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }
    return await AuthContext.login(email.trim(), password);
  }
}
