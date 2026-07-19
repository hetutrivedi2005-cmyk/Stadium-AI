import { AuthContext } from '../context/AuthContext.js';

export class RegisterController {
  static async submit(fullName, email, password, role) {
    if (!fullName || !email || !password || !role) {
      throw new Error("All fields are required for registration.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    return await AuthContext.register(fullName.trim(), email.trim(), password, role);
  }
}
