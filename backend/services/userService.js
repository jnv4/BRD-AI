import { query } from '../db/connection.js';
import bcrypt from 'bcryptjs';

// Get all users (without passwords for security)
export const getAllUsers = async () => {
  const result = await query(
    'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at'
  );
  return result.rows;
};

// Get user by ID
export const getUserById = async (id) => {
  const result = await query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

// Get user by email (includes password for login verification)
export const getUserByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

// Create new user
export const createUser = async (userData) => {
  const { name, email, password, role } = userData;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = await query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );
  
  return result.rows[0];
};

// Update user
export const updateUser = async (id, updates) => {
  const { name, email, role, password } = updates;
  
  let queryText;
  let params;
  
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    queryText = `UPDATE users SET name = $1, email = $2, role = $3, password = $4 
                 WHERE id = $5 
                 RETURNING id, name, email, role, updated_at`;
    params = [name, email, role, hashedPassword, id];
  } else {
    queryText = `UPDATE users SET name = $1, email = $2, role = $3 
                 WHERE id = $4 
                 RETURNING id, name, email, role, updated_at`;
    params = [name, email, role, id];
  }
  
  const result = await query(queryText, params);
  return result.rows[0] || null;
};

// Delete user
export const deleteUser = async (id) => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

// Verify password for login
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Login user
export const loginUser = async (email, password) => {
  const user = await getUserByEmail(email);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return { success: false, message: 'Invalid password' };
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};
