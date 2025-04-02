import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        role: string
      }
    }
  }
}

// Middleware to authenticate user
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string
      role: string
    }

    // Add user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    }

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

// Middleware to authorize based on roles
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized: Insufficient permissions" })
    }

    next()
  }
}

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }

  next()
}

