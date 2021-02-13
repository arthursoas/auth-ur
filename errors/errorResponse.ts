import { NextApiResponse } from 'next';
import { BaseError } from './errors';

export const generateErrorResponse = (res: NextApiResponse, error: BaseError): void => {
  let status: number;
  switch (error.name) {
    case 'AuthorizationError':
      status = 401;
      break;
    default:
      status = 500;
      break;
  };

  res.status(status)
    .json({
      error: {
        code: error.code,
        message: error.message
      }
    })
}