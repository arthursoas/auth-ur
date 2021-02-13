import { utils, Counter, ModeOfOperation } from 'aes-js';
import { IncomingHttpHeaders } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthorizationError } from '@/errors/errors';
import { generateErrorResponse } from '@/errors/errorResponse';
import { AUTHORIZATION_EMPTY, AUTHORIZATION_INVALID_TYPE } from '@/errors/errorCodes';
import { Credentials } from '@/interfaces/auth/credentials';
import { Token } from '@/interfaces/auth/token';

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  let credentials: Credentials;
  try {
    credentials = getAuthorization(req.headers);
  }
  catch (error) {
    generateErrorResponse(res, error);
    return;
  }

  res.status(201)
    .json(generateToken(credentials))
}

const getAuthorization = (headers: IncomingHttpHeaders): Credentials => {
  const authorization: string = headers.authorization;

  if (!authorization) {
    throw new AuthorizationError(
      AUTHORIZATION_EMPTY,
      'Authorization header is empty.'
    );
  }

  if (!authorization.startsWith('Basic')) {
    throw new AuthorizationError(
      AUTHORIZATION_INVALID_TYPE,
      'Authorization must be basic type.'
    );
  }

  const credentials: string = Buffer
    .from(authorization.split(' ')[1], 'base64')
    .toString();

  return {
    username: credentials.split(':')[0],
    password: credentials.split(':')[1]
  }
}

const generateToken = (credentials: Credentials): Token => {
  const key = Buffer.from(process.env.AUTH_AES_KEY, 'utf8');
  const aesCtr = new ModeOfOperation.ctr(key, new Counter(5));

  const usernameBytes = utils.utf8.toBytes(credentials.username);
  const encryptedUsername = aesCtr.encrypt(usernameBytes);
  const usernameHex = utils.hex.fromBytes(encryptedUsername);

  const permissionBytes = utils.utf8.toBytes('Admin');
  const encryptedPermission = aesCtr.encrypt(permissionBytes);
  const permissionHex = utils.hex.fromBytes(encryptedPermission);

  const lifetimeBytes = utils.utf8.toBytes((Date.now() + 3_600_000).toString())
  const encryptedLifetime = aesCtr.encrypt(lifetimeBytes);
  const lifetimeHex = utils.hex.fromBytes(encryptedLifetime);

  const token = `${usernameHex}.${permissionHex}.${lifetimeHex}`;

  const validatorKey = Buffer.from(process.env.AUTH_AES_VALIDATOR_KEY, 'utf8');
  const validatorAesCtr = new ModeOfOperation.ctr(validatorKey, new Counter(5));
  const tokenBytes = utils.utf8.toBytes(token);
  const encryptedToken = validatorAesCtr.encrypt(tokenBytes);
  const tokenHex = utils.hex.fromBytes(encryptedToken);

  return {
    token: `Bearer ${token}.${tokenHex}`,
    expiresIn: 3600
  };
}

export default handler;