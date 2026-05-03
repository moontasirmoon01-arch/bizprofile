import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export const businessSchema = z.object({
  name: z.string().min(2, "Business name required"),
  category: z.string().min(1, "Category required"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().min(1, "City required"),
  street: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Bangladesh"),
  postalCode: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  currency: z.string().default("BDT"),
  category: z.string().optional(),
  inStock: z.boolean().default(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ProductInput = z.infer<typeof productSchema>;
