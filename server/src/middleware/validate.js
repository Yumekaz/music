export function validateQuery(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      response.status(400).json({
        error: "Invalid query",
        details: result.error.flatten()
      });
      return;
    }

    request.queryInput = result.data;
    next();
  };
}

export function notFound(_request, response) {
  response.status(404).json({ error: "Not found" });
}

export function errorHandler(error, _request, response, _next) {
  console.error("ErrorHandler caught:", error);
  response.status(error.status || 500).json({
    error: error.message || "Internal server error"
  });
}
