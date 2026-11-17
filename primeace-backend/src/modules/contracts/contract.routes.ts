import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import verifyCsrfToken from "../../middleware/verifyCsrfToken.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createContractSchema,
  updateContractSchema,
  contractActionSchema,
  contractAccessTokenParamsSchema,
  contractClientResponseSchema,
  listContractsSchema
} from "./contract.validation.js";

import {
  createContract,
  getContract,
  getContractsHandler,
  updateContract,
  issueContractHandler,
  withdrawContractHandler,
  createContractRevisionHandler,
  getPublicContract,
  respondToContractHandler
} from "./contract.controller.js";

const contractRouter = Router();

/*
|--------------------------------------------------------------------------
| Public client routes
|--------------------------------------------------------------------------
*/

contractRouter.get(
  "/public/:token",
  validateRequest(contractAccessTokenParamsSchema),
  getPublicContract
);

contractRouter.post(
  "/public/:token/respond",
  validateRequest(contractClientResponseSchema),
  respondToContractHandler
);

/*
|--------------------------------------------------------------------------
| Administrator routes
|--------------------------------------------------------------------------
*/

contractRouter.use(authenticate);

contractRouter.post(
  "/",
  verifyCsrfToken,
  validateRequest(createContractSchema),
  createContract
);

contractRouter.get(
  "/",
  validateRequest(listContractsSchema),
  getContractsHandler
);

contractRouter.get(
  "/:contractId",
  validateRequest(contractActionSchema),
  getContract
);

contractRouter.patch(
  "/:contractId",
  verifyCsrfToken,
  validateRequest(updateContractSchema),
  updateContract
);

contractRouter.post(
  "/:contractId/issue",
  verifyCsrfToken,
  validateRequest(contractActionSchema),
  issueContractHandler
);

contractRouter.post(
  "/:contractId/withdraw",
  verifyCsrfToken,
  validateRequest(contractActionSchema),
  withdrawContractHandler
);

contractRouter.post(
  "/:contractId/revisions",
  verifyCsrfToken,
  validateRequest(contractActionSchema),
  createContractRevisionHandler
);

export default contractRouter;
