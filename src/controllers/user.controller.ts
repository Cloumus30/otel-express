import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiResponse } from "../types/response";

// Field selector to exclude password from Prisma queries
const userSelectFields = {
  id: true,
  name: true,
  username: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

// Create a new User
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      const response: ApiResponse = {
        success: false,
        message: "Fields name, username, email, and password are required",
      };
      res.status(400).json(response);
      return;
    }

    // Check existing username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      const response: ApiResponse = {
        success: false,
        message: `${field} already in use`,
      };
      res.status(409).json(response);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
      select: userSelectFields,
    });

    const response: ApiResponse = {
      success: true,
      message: "User created successfully",
      data: newUser,
    };
    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to create user",
      error: error.message || error,
    };
    res.status(500).json(response);
  }
};

// Get All Users
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: userSelectFields,
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Users retrieved successfully",
      data: users,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve users",
      error: error.message || error,
    };
    res.status(500).json(response);
  }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: `User with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: "User retrieved successfully",
      data: user,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve user",
      error: error.message || error,
    };
    res.status(500).json(response);
  }
};

// Update User
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, username, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        message: `User with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    // Check unique conflicts if username or email is being updated
    if (username && username !== existingUser.username) {
      const userWithUsername = await prisma.user.findUnique({ where: { username } });
      if (userWithUsername) {
        const response: ApiResponse = {
          success: false,
          message: "Username already in use",
        };
        res.status(409).json(response);
        return;
      }
    }

    if (email && email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({ where: { email } });
      if (userWithEmail) {
        const response: ApiResponse = {
          success: false,
          message: "Email already in use",
        };
        res.status(409).json(response);
        return;
      }
    }

    const updateData: {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelectFields,
    });

    const response: ApiResponse = {
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to update user",
      error: error.message || error,
    };
    res.status(500).json(response);
  }
};

// Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        message: `User with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "User deleted successfully",
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to delete user",
      error: error.message || error,
    };
    res.status(500).json(response);
  }
};
