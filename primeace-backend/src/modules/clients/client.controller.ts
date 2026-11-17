import type { RequestHandler } from "express";

import {
  createClient,
  getClientById,
  listClients
} from "./client.service.js";

import type {
  CreateClientInput,
  ListClientsQuery
} from "./client.service.js";

export const createClientController: RequestHandler = async (
  _request,
  response,
  next
) => {
  try {
    const input = response.locals.validated
      .body as CreateClientInput;

    const client = await createClient(input);

    response.status(201).json({
      success: true,
      message: "Client created successfully.",
      data: client
    });
  } catch (error) {
    next(error);
  }
};

export const listClientsController: RequestHandler = async (
  _request,
  response,
  next
) => {
  try {
    const query = response.locals.validated
      .query as ListClientsQuery;

    const result = await listClients(query);

    response.status(200).json({
      success: true,
      message: "Clients retrieved successfully.",
      data: result.clients,
      meta: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getClientController: RequestHandler = async (
  request,
  response,
  next
) => {
  try {
    const { clientId } = response.locals.validated
      .params as { clientId: string };

    const client = await getClientById(clientId);

    response.status(200).json({
      success: true,
      message: "Client retrieved successfully.",
      data: client
    });
  } catch (error) {
    next(error);
  }
};
