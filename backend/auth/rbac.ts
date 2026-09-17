import { APIGatewayProxyEvent } from 'aws-lambda';

export type Role = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  role: Role;
  email: string;
  name: string;
}

export interface RBACPolicy {
  [endpoint: string]: {
    [method: string]: Role[];
  };
}

const rbacPolicies: RBACPolicy = {
  '/resources': {
    GET: ['admin', 'operator', 'viewer'],
  },
  '/api/0/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/1/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/2/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/3/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/4/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/5/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/6/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/7/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/8/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/9/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/10/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/11/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/12/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/13/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/14/bulk': {
    POST: ['admin', 'operator'],
  },
  '/api/15/bulk': {
    POST: ['admin', 'operator'],
  },
};

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext | null {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];
  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return {
      userId: decoded.userId || 'unknown',
      role: (decoded.role || 'viewer') as Role,
      email: decoded.email || 'unknown@example.com',
      name: decoded.name || 'Unknown',
    };
  } catch (error) {
    return null;
  }
}

export function checkPermission(path: string, method: string, role: Role): boolean {
  const policy = rbacPolicies[path]?.[method];
  if (!policy) {
    return false;
  }
  return policy.includes(role);
}

export function authorizeRequest(
  event: APIGatewayProxyEvent,
  requiredRoles?: Role[]
): { authorized: boolean; context?: AuthContext; error?: string } {
  const authContext = extractAuthContext(event);
  if (!authContext) {
    return { authorized: false, error: 'Missing or invalid authorization header' };
  }

  const path = event.resource || event.path || '/';
  const method = event.httpMethod || 'GET';

  if (!checkPermission(path, method, authContext.role)) {
    return { authorized: false, error: 'Insufficient permissions for this operation' };
  }

  if (requiredRoles && !requiredRoles.includes(authContext.role)) {
    return { authorized: false, error: 'Insufficient permissions for this operation' };
  }

  return { authorized: true, context: authContext };
}