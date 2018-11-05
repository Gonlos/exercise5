const { Validator, ValidationError } = require("express-json-validator-middleware");
const debug = require("debug")("debug:validateBody");

const validate = new Validator({ allErrors: true }).validate;

const bodySchema = {
  type: "object",
  required: ["destination", "message"],
  properties: {
    destination: {
      type: "string",
      pattern: "^[a-zA-Z]\\w+$",
      maxLength: 50,
      minLength: 5
    },
    message: {
      type: "string",
      maxLength: 200,
      minLength: 1
    }
  }
};

const validateBody = validate({ body: bodySchema });

const parseValidationError = errors => {
  return errors.validationErrors.body
    .map((error, index, array) => {
      let text =
        error.keyword == "required"
          ? `field "${error.params.missingProperty}" is required`
          : `field "${error.dataPath.slice(1)}" ${error.message}`;
      if (index === 0) {
        return text.charAt(0).toUpperCase() + text.slice(1);
      } else if (array.length - 1 === index) {
        return " and " + text;
      } else {
        return ", " + text;
      }
    })
    .join("");
};

const middlewareValidationError = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    debug(err);
    res.status(400).json({
      ok: false,
      message: parseValidationError(err)
    });
    next();
  } else next(err);
};

module.exports = { validateBody, middlewareValidationError };
