import {JSONSchema7} from "json-schema";

export const CodyPlayConfigSchema: JSONSchema7 = {
  title: "Cody Play Config",
  type: "object",
  description: "Runtime configuration for a Cody Play powered app",
  additionalProperties: false,
  required: ["pages"],
  properties: {
    pages: {
      type: "object",
      title: "Pages",
      description: "Map of page name to page configuration. A page name has the format: [Service].[Name]. The default service is \"App\". Two types of pages exist. 1) Top-Level Page: has a sidebar configuration and is therefor accessible from the app sidebar. 2) Sub-Level Page: is accessible from a top-level page and usually has a dynamic route part e.g. the id of an entity.",
      patternProperties: {
        "^[A-Z][A-Za-z0-9]+.[A-Z][A-Za-z0-9]+$": {
          type: "object",
          title: "Page Configuration",
          description: "Each page is a container for a collection of commands and views, accessible in the app via its route.",
          additionalProperties: false,
          required: ["name", "route", "topLevel"],
          if: {
            properties: {
              type: {
                enum: ["dialog", "drawer"]
              }
            }
          },
          then: {
            required: ["mainPage"]
          },
          properties: {
            service: {
              type: "string",
              title: "Module/Service",
              description: "A Cody Play app can be organized in multiple modules or services. The default service is \"App\" which is ok for small apps. It's recommended to organize larger applications in modules that align with the business contexts.",
              examples: [
                "Crm",
                "OnlineShop",
                "Admin",
                "BackOffice",
                "Payments",
                "Shipping",
                "Accounting"
              ]
            },
            name: {
              type: "string",
              title: "Page Name",
              description: "Name of the page incl. service prefix. This should be identical to the property name of the pages map",
              examples: [
                "App.Dashboard",
                "Crm.Customers",
                "Admin.ProjectDetails",
                "Shipping.OrderOverview"
              ]
            },
            route: {
              type: "string",
              title: "Route",
              description: "Each route should start with a \"/\". The slash separates route parts. Sub-level pages can have dynamic route parts of the format /:[paramter] If a parameter is followed by a question mark, the parameter is optional. It is recommended to use the service of the page as the first route part to avoid conflicts of similar routes in different services.",
              examples: [
                "/app/customers",
                "/app/customers/:customerId",
                "/app/customers/:customerId/projects",
                "/app/customers/:customerId/projects/:projectId",
                "/app/customers/:customerId/projects/:projectId/:finished?"
              ]
            },
            title: {
              type: "string",
              title: "Page Title",
              description: "Appears as main heading (H1) on the page in the app. If not set, \"name\" is titleized and displayed instead."
            },
            "title:expr": {
              type: "string",
              title: "Dynamic Page Title",
              description: "Similar to \"title\", but uses Jexl to evaluate the given expression before displaying the result. In the Jexl Context you have access to: page, store, user, theme. See prooph board wiki for details about expressions: https://wiki.prooph-board.com/board_workspace/Expressions.html",
              examples: [
                "$> (user|role('Admin')) ? 'Hello Admin' : 'Hello User'",
                "$> page|data('/Crm/Customer')|get('name')"
              ]
            },
            type: {
              type: "string",
              title: "Page Type",
              description: "Type of the page. If type is \"dialog\" or \"drawer\", the \"mainPage\" property should be set to the full qualified page name (Service.PageName) of the page where the dialog or drawer should appear.",
              enum: ["standard", "dialog", "drawer"],
              default: "standard"
            },
            mainPage: {
              type: "string",
              title: "Main Page",
              description: "Full qualified name of the page (Service.PageName) where a dialog or drawer should appear. See \"type\" property for details."
            },
            topLevel: {
              type: "boolean",
              title: "Is this a Top-Level Page?"
            },
            breadcrumb: {
              oneOf: [
                {
                  type: "string",
                  title: "Fixed Breadcrumb Label",
                  description: "A fixed text that represents the page in the breadcrumbs of the app."
                },
                {
                  type: "object",
                  title: "Dynamic Breadcrumb Label",
                  description: "A dynamic breadcrumb label derived from data using rules.",
                  additionalProperties: false,
                  required: ["data", "label"],
                  properties: {
                    data: {
                      $ref: "#/definitions/data-reference",
                      title: "Data Reference",
                      description: "The data reference is loaded from the server. The query schema configured for the data reference should only require properties that are available as route parameters in the current route."
                    },
                    label: {
                      oneOf: [
                        {
                          $ref: "#/definitions/jexl-expr",
                          title: "Jexl Expression",
                          description: "The Jexl expression has access to the 'data' reference and should evaluate to a string value that is used as label of the breadcrumb."
                        },
                        {
                          type: "array",
                          title: "Ruleset",
                          description: "List of rules to provide a label for the breadcrumb. The rules have access to the 'data' reference, and should assign a variable 'value', which should be of type string. Value is then used as the label of the breadcrumb.",
                          items: {
                            $ref: "#/definitions/rule"
                          }
                        }
                      ]
                    }
                  },
                  examples: [
                    {
                      data: "/App/Customer",
                      label: "$> data.name"
                    },
                    {
                      data: "/App/Customer",
                      label: [
                        {
                          rule: "condition",
                          if: "$> data.firstName",
                          then: {
                            assign: {
                              variable: "value",
                              value: "$> data.firstName + ' ' + data.lastName"
                            }
                          },
                          else: {
                            assign: {
                              variable: "value",
                              value: "$> data.lastName"
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
  },
  definitions: {
    "data-reference": {
      type: "string",
      title: "Data Reference",
      description: "The fully qualified name of a data type in the format: [Service].[Namespace].[TypeName]",
      examples: [
        "App.Payments.Invoice",
        "Crm.Masterdata.Customer",
        "Planner.Project.Task"
      ]
    },
    "jexl-expr": {
      type: "string",
      pattern: "^\$> .+$",
      title: "Jexl Expression",
      description: "An expression evaluated using Jexl (JavaScript Expression Language). The prefix \"$> \" is a Cody specific syntax to indicate that the given string is an expression. Learn more about Jexl Expressions in the prooph board wiki: https://wiki.prooph-board.com/board_workspace/Expressions.html",
      default: "$> "
    },
    "rule": {
      type: "object",
      title: "Rule",
      description: "Each rule is a combination of a condition (defines if the rule should be executed), and an execution part.",
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["rule", "then"],
          title: "Always Rule",
          description: "This rule will always execute.",
          properties: {
            rule: {
              const: "always",
            },
            then: {
              $ref: "#/definitions/rule-then-types"
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["rule", "if", "then"],
          title: "Conditional IF Rule",
          description: "This rule will be executed IF the condition is met, otherwise the ELSE part will be executed if given.",
          properties: {
            rule: {
              const: "condition",
            },
            if: {
              $ref: "#/definitions/jexl-expr",
              title: "IF"
            },
            then: {
              $ref: "#/definitions/rule-then-types",
            },
            else: {
              $ref: "#/definitions/rule-then-types",
              title: "ELSE",
              description: "If the condition is not met, the else part will be executed."
            },
            stop: {
              type: "boolean",
              title: "Stop Execution",
              description: "If the condition is not met and stop is set to true, following rules will not be executed."
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["rule", "if_not", "then"],
          title: "Conditional IF NOT Rule",
          description: "This rule will be executed IF the condition is NOT met, otherwise the ELSE part will be executed if given.",
          properties: {
            rule: {
              const: "condition",
            },
            if_not: {
              $ref: "#/definitions/jexl-expr",
              title: "IF NOT"
            },
            then: {
              $ref: "#/definitions/rule-then-types"
            },
            else: {
              $ref: "#/definitions/rule-then-types",
              title: "ELSE",
              description: "If the condition is met, the else part will be executed."
            },
            stop: {
              type: "boolean",
              title: "Stop Execution",
              description: "If the condition is met and stop is set to true, following rules will not be executed."
            }
          }
        }
      ]
    },
    "rule-then-types": {
      type: "object",
      additionalProperties: false,
      title: "THEN",
      description: "If the rule condition is true, the 'then' part of the rule is executed. Cody offers different execution rules that can also be combined.",
      oneOf: [
        {
          $ref: "#/definitions/rule-then-assign-variable"
        },
        {
          $ref: "#/definitions/rule-then-for-each"
        },
        {
          $ref: "#/definitions/rule-then-record-event"
        },
        {
          $ref: "#/definitions/rule-then-trigger-command"
        },
        {
          $ref: "#/definitions/rule-then-call-service"
        },
        {
          $ref: "#/definitions/rule-then-try-catch"
        },
        {
          $ref: "#/definitions/rule-then-find-information"
        }
      ]
    },
    "prop-mapping": {
      title: "Property Mapping",
      description: "A structured way to assign a complex value like an array or an object to a variable.",
      oneOf: [
        {
          $ref: "#/definitions/prop-mapping-string"
        },
        {
          $ref: "#/definitions/prop-mapping-object"
        },
        {
          $ref: "#/definitions/prop-mapping-array"
        }
      ]
    },
    "prop-mapping-string": {
      title: "Expression Mapping",
      description: "A Jexl expression that should evaluate to the value being assigned. Fixed values also have to be provided via expression. Fixed strings need to be surrounded by single quotes.",
      $ref: "#/definitions/jexl-expr",
      examples: [
        "$> 'a fixed string'",
        "$> 5",
        "$> page|data('/App/Project')|get('name', 'Unknown name')"
      ]
    },
    "prop-mapping-object": {
      title: "Object Mapping",
      description: "Defines an object where each key is assigned a value using property mapping. The special key '$merge' can be used, to merge the value returned by property mapping into the object.",
      patternProperties: {
        ".+": {
          $ref: "#/definitions/prop-mapping"
        }
      },
      examples: [
        {
          "name": "$> customer.firstName + ' ' + customer.LastName",
          "deliveryAddress": {
            "street": "customer.address.street + ' ' + customer.address.streetNumber",
            "city": "customer.address.city",
            "zipCode": "customer.address.zipCode"
          }
        },
        {
          "$merge": "$> anotherObject",
          "additionalKey": "$> 'some additional string'"
        }
      ]
    },
    "prop-mapping-array": {
      title: "Array Mapping",
      description: "Defines an array where each array item is assigned a value using property mapping.",
      type: "array",
      items: {
        $ref: "#/definitions/prop-mapping"
      },
      examples: [
        [
          "$> 'one'",
          "$> 'two'",
          "$> 'three'"
        ]
      ]
    },
    "rule-then-assign-variable": {
      type: "object",
      additionalProperties: false,
      required: ["assign"],
      title: "Assign Variable",
      description: "This rule allows you to assign a value to a variable that either exists already in the Jexl context of the current ruleset or if it does not exist, the variable will be added to the current Jexl context and is then available in the next rules.",
      properties: {
        assign: {
          type: "object",
          additionalProperties: false,
          required: ["variable", "value"],
          properties: {
            variable: {
              type: "string",
              minLength: 1,
              title: "Variable",
              description: "The name of the variable"
            },
            value: {
              title: "Value",
              $ref: "#/definitions/prop-mapping"
            }
          }
        }
      },
      examples: [
        {
          assign: {
            variable: "address",
            value: "$> page|data('/App/Company')|get('address', {street: 'Unknown', city: 'Unknown', zipCode: 'Unknown'})"
          }
        },
        {
          assign: {
            variable: "projectFinished",
            value: "$> page|data('/App/Project')|get('tasks', [])|reduce('sum == true ? item.finished : false', true)"
          }
        }
      ]
    },
    "rule-then-for-each": {
      type: "object",
      additionalProperties: false,
      required: ["forEach"],
      title: "For Each Rule",
      description: "Iterate over a list and execute the then part for each item of the list.",
      properties: {
        forEach: {
          type: "object",
          additionalProperties: false,
          required: ["variable", "then"],
          properties: {
            variable: {
              type: "string",
              minLength: 1,
              title: "Variable",
              description: "Name of the variable to loop over. Variable should be of type array, and it should be available in the current ruleset Jexl context."
            },
            then: {
              $ref: "#/definitions/rule-then-types",
              title: "Then",
              description: "The Then part is executed for each item in the variable list. 'item' is made available in the rule Jexl context."
            }
          }
        }
      },
      examples: [
        {
          forEach: {
            variable: "projectTasks",
            then: {
              log: {
                msg: "$> item.name + ' is ' + (item.finished ? 'finished' : 'in progress')"
              }
            }
          }
        }
      ]
    },
    "rule-then-record-event": {
      type: "object",
      title: "Record Event",
      description: "Record a new event in the event store. This rule can only be used in business rules that are either defined for a command or an aggregate handling a command.",
      additionalProperties: false,
      required: ["record"],
      properties: {
        record: {
          type: "object",
          title: "Record",
          additionalProperties: false,
          required: ["event", "mapping"],
          properties: {
            event: {
              type: "string",
              minLength: 1,
              title: "Event Name",
              description: "The full qualified name of the event in one of the formats:\n\n- non-aggregate events: [Service].[PastTenseEventName]\n\n- aggregate events: [Service].[Aggregate].[PastTenseEventName].\n\nPlease note: an event is a fact that has happened in the system, hence the naming convention is past tense event names, e.g. 'Project Finished', 'Room Booked', 'Appointment Made'"
            },
            mapping: {
              $ref: "#/definitions/prop-mapping",
              title: "Mapping",
              description: "Assign a payload to the event using property mapping"
            },
            meta: {
              $ref: "#/definitions/prop-mapping",
              title: "Meta",
              description: "Assign optional metadata to the event using property mapping. By default, command metadata is forwarded to the event. If you assign custom metadata, but you also want to include the command metadata then use:\n\n`{\n  \"$merge\": \"$> meta\",\n  \"customKey\": \"$> 'custom_value'\"\n}`."
            }
          }
        }
      },
      examples: [
        {
          record: {
            event: "Crm.CustomerAdded",
            mapping: "$> command"
          }
        },
        {
          record: {
            event: "BookingEngine.RoomBooked",
            mapping: {
              "$merge": "$> command",
              "bookedAt": "$> now()|isoDateTime()"
            }
          }
        },
        {
          record: {
            event: "Calendar.AppointmentMade",
            mapping: "$> command",
            meta: {
              "$merge": "$> meta",
              "public": "$> true"
            }
          }
        }
      ]
    },
    "rule-then-trigger-command": {
      type: "object",
      title: "Trigger Command",
      description: "This rule is only available in policies (automations). Each policy reacts on a specific event type and automatically triggers one or more new commands for the system to handle.",
      additionalProperties: false,
      required: ["trigger"],
      properties: {
        trigger: {
          type: "object",
          title: "Trigger",
          additionalProperties: false,
          required: ["command", "mapping"],
          properties: {
            command: {
              type: "string",
              minLength: 1,
              title: "Command Name",
              description: "The full qualified name of the command in the format: [Service].[CommandName]\n\nCommands are intentions that the system might or might not process depending on the business rules, that are executed when a command is received by the system. The naming convention is imperative mood, e.g. 'Book Room', 'Register User', 'Make Appointment'."
            },
            mapping: {
              $ref: "#/definitions/prop-mapping",
              title: "Mapping",
              description: "Assign a payload to the command using property mapping"
            },
            meta: {
              $ref: "#/definitions/prop-mapping",
              title: "Meta",
              description: "Assign optional metadata to the command using property mapping. By default, event metadata is forwarded to the command. If you assign custom metadata, but you also want to include the event metadata then use:\n\n`{\n  \"$merge\": \"$> meta\",\n  \"customKey\": \"$> 'custom_value'\"\n}`."
            }
          }
        }
      },
      examples: [
        {
          trigger: {
            command: "BookingEngine.BookRoom",
            mapping: {
              "bookingId": "$> uuid()",
              "period": {
                "from": "$> event.from",
                "to": "$> event.to"
              },
              "bookedBy": "$> meta.user.userId"
            },
            meta: {
              "$merge": "$> meta",
              "serverCommand": "$> true"
            }
          }
        }
      ]
    },
    "rule-then-call-service": {
      type: "object",
      title: "Call Service",
      description: "Call a service injected as a dependency into business rules, policies, or query resolvers. A service is either a callable function or an object with a callable method.",
      additionalProperties: false,
      required: ["call"],
      properties: {
        call: {
          type: "object",
          title: "Call",
          additionalProperties: false,
          required: ["service"],
          properties: {
            service: {
              type: "string",
              title: "Service",
              description: "The service name as defined in the dependency configuration."
            },
            arguments: {
              $ref: "#/definitions/prop-mapping",
              title: "Arguments",
              description: "If the service (method) takes one or more arguments as input, you can specify them using property mapping. Use an array of property mappings for multiple arguments."
            },
            method: {
              type: "string",
              title: "Method",
              description: "If service is an object with a callable method, configure the name of the method with this property. If method is not set, Cody will call the service directly expecting a callable function."
            },
            async: {
              type: "boolean",
              title: "Async?",
              description: "Does the service (method) return a promise and should be called with async/await?",
              default: false
            },
            result: {
              type: "object",
              title: "Result",
              description: "If the service (method) returns a result, you can assign the return value to a (new) variable in the current ruleset Jexl context.",
              additionalProperties: false,
              required: ["variable"],
              properties: {
                variable: {
                  type: "string",
                  minLength: 1,
                  title: "Variable",
                  description: "Name of the variable. Can be a new or existing variable in the current ruleset Jexl context"
                },
                mapping: {
                  $ref: "#/definitions/prop-mapping",
                  title: "Mapping",
                  description: "Use property mapping to map the service (method) return value to the variable in the current ruleset Jexl context. This is useful when you need the result in another shape than returned by the service (method).\n\nThe return value is made available as variable 'data' in the property mapping rules."
                }
              }
            }
          }
        }
      },
      examples: [
        {
          call: {
            service: "AuthService",
            arguments: [
              "$> meta.user.userId"
            ],
            method: "get",
            async: true,
            result: {
              variable: "username",
              mapping: "$> data.displayName"
            }
          }
        }
      ]
    },
    "rule-then-try-catch": {
      type: "object",
      title: "Try-Catch-Finally",
      description: "Executes a 'then' block, with optional 'catch' and 'finally' blocks for error handling and cleanup.",
      additionalProperties: false,
      required: ["try"],
      properties: {
        try: {
          type: "object",
          additionalProperties: false,
          required: ["then"],
          properties: {
            then: {
              $ref: "#/definitions/rule-then-types",
              title: "Try Then",
              description: "Block executed in the try section."
            },
            catch: {
              type: "object",
              additionalProperties: false,
              required: ["then"],
              properties: {
                then: {
                  $ref: "#/definitions/rule-then-types",
                  title: "Catch Then",
                  description: "Block executed if an error occurs in the try block."
                }
              }
            },
            finally: {
              type: "object",
              additionalProperties: false,
              required: ["then"],
              properties: {
                then: {
                  $ref: "#/definitions/rule-then-types",
                  title: "Finally Then",
                  description: "Block always executed after try/catch, for cleanup logic."
                }
              }
            }
          }
        }
      },
      examples: [
        {
          try: {
            then: {
              call: {
                service: "PaymentService",
                method: "charge",
                arguments: ["$> command.amount"]
              }
            },
            catch: {
              then: {
                log: { msg: "Payment failed" }
              }
            },
            finally: {
              then: {
                log: { msg: "Payment attempt finished" }
              }
            }
          }
        }
      ]
    },
    "rule-then-find-information": {
      type: "object",
      title: "Find Information",
      description:
        "Query information with filter, skip, limit, and ordering options.",
      additionalProperties: false,
      required: ["find"],
      properties: {
        find: {
          type: "object",
          additionalProperties: false,
          required: ["information", "filter"],
          properties: {
            information: {
              type: "string",
              title: "Information",
              description: "The information resource to query."
            },
            filter: { $ref: "#/definitions/filter" },
            skip: {
              type: "integer",
              minimum: 0
            },
            limit: {
              type: "integer",
              minimum: 1
            },
            // @TODO: Add sort-order definition and fix example
            orderBy: {
              $ref: "#/definitions/sort-order"
            },
            variable: {
              type: "string",
              default: "information",
              description: "Variable name to store the result. Defaults to 'information'."
            }
          }
        }
      },
      examples: [
        {
          find: {
            information: "orders",
            filter: {
              eq: { prop: "status", value: "$> query.status" }
            },
            skip: 0,
            limit: 10,
            orderBy: { prop: "createdAt", direction: "desc" },
            variable: "pendingOrders"
          }
        },
        {
          find: {
            information: "customers",
            filter: {
              and: [
                { like: { prop: "name", value: "$> 'John%'" } },
                { gte: { prop: "age", value: "$> 21" } }
              ]
            },
            variable: "adultJohns"
          }
        }
      ]
    },
    //@TODO: All filter strings are #/definitions/jexl-expr refs to provide filter values at runtime
    "filter": {
      title: "Filter",
      description: "Filter definition for querying information.",
      oneOf: [
        { $ref: "#/definitions/and-filter" },
        { $ref: "#/definitions/or-filter" },
        { $ref: "#/definitions/not-filter" },
        { $ref: "#/definitions/any-filter" },
        { $ref: "#/definitions/any-of-doc-id-filter" },
        { $ref: "#/definitions/any-of-filter" },
        { $ref: "#/definitions/doc-id-filter" },
        { $ref: "#/definitions/eq-filter" },
        { $ref: "#/definitions/exists-filter" },
        { $ref: "#/definitions/gte-filter" },
        { $ref: "#/definitions/gt-filter" },
        { $ref: "#/definitions/in-array-filter" },
        { $ref: "#/definitions/like-filter" },
        { $ref: "#/definitions/lte-filter" },
        { $ref: "#/definitions/lt-filter" }
      ]
    },
    "and-filter": {
      type: "object",
      required: ["and"],
      properties: {
        and: {
          type: "array",
          items: { $ref: "#/definitions/filter" }
        }
      }
    },
    "or-filter": {
      type: "object",
      required: ["or"],
      properties: {
        or: {
          type: "array",
          items: { $ref: "#/definitions/filter" }
        }
      }
    },
    "not-filter": {
      type: "object",
      required: ["not"],
      properties: {
        not: { $ref: "#/definitions/filter" }
      }
    },
    "any-filter": {
      type: "object",
      required: ["any"],
      properties: {
        any: { type: "boolean", default: true }
      }
    },
    "any-of-doc-id-filter": {
      type: "object",
      required: ["anyOfDocId"],
      properties: {
        anyOfDocId: { type: "string" }
      }
    },
    "any-of-filter": {
      type: "object",
      required: ["anyOf"],
      properties: {
        anyOf: {
          type: "object",
          required: ["prop", "valueList"],
          properties: {
            prop: { type: "string" },
            valueList: { type: "string" }
          }
        }
      }
    },
    "doc-id-filter": {
      type: "object",
      required: ["docId"],
      properties: {
        docId: { type: "string" }
      }
    },
    "eq-filter": {
      type: "object",
      required: ["eq"],
      properties: {
        eq: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "exists-filter": {
      type: "object",
      required: ["exists"],
      properties: {
        exists: {
          type: "object",
          required: ["prop"],
          properties: {
            prop: { type: "string" }
          }
        }
      }
    },
    "gte-filter": {
      type: "object",
      required: ["gte"],
      properties: {
        gte: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "gt-filter": {
      type: "object",
      required: ["gt"],
      properties: {
        gt: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "in-array-filter": {
      type: "object",
      required: ["inArray"],
      properties: {
        inArray: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "like-filter": {
      type: "object",
      required: ["like"],
      properties: {
        like: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "lte-filter": {
      type: "object",
      required: ["lte"],
      properties: {
        lte: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    "lt-filter": {
      type: "object",
      required: ["lt"],
      properties: {
        lt: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    }
  }
};
