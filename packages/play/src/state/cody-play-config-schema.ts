import {JSONSchema7} from "json-schema";

const FORM_JEXL_CTX = "In the Jexl context you have access to:\n\n'data' -> the form data,\n\n'page' -> page registry with access to loaded view components,\n\n'store' -> global store,\n\n'user' -> current user,\n\n'theme' -> MUI theme,\n\n'routeParams' -> current route params,\n\n'mode' -> one of: 'pageForm' | 'pageView' | 'dialogForm' | 'commandDialogForm' | 'dialogView' | 'listView'";

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
          title: "Page Configuration",
          description: "Each page is a container for a collection of commands and views, accessible in the app via its route. Top",
          oneOf: [
            {
              type: "object",
              title: "Top-Level Page",
              description: "Top-Level pages are accessible from the app sidebar. They usually don't have dynamic route parameters.",
              additionalProperties: false,
              required: ["name", "route", "topLevel", "sidebar"],
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
                topLevel: {
                  type: "boolean",
                  const: true,
                  title: "This is a Top-Level Page"
                },
                service: {
                  $ref: "#/definitions/service"
                },
                name: {
                  $ref: "#/definitions/page-name"
                },
                route: {
                  $ref: "#/definitions/page-route"
                },
                sidebar: {
                  type: "object",
                  title: "Sidebar",
                  description: "Defines the sidebar menu item of the page",
                  additionalProperties: false,
                  required: ["label", "icon"],
                  properties: {
                    label: {
                      type: "string",
                      title: "Label",
                      description: "Menu item label",
                      minLength: 1
                    },
                    "label:t": {
                      $ref: "#/definitions/t-key"
                    },
                    icon: {
                      $ref: "#/definitions/mdi-icon",
                      title: "Menu item icon"
                    },
                    group: {
                      title: "Group",
                      description: "Sidebar items can be organized in collapsable sidebar groups. Items with same group name belong together. The first item in the group defines the group position within the sidebar. Sidebar and group position depends either on the position in the page registry configuration and/or the optional 'position' property of each sidebar item.",
                      oneOf: [
                        {
                          type: "string",
                          title: "Group Name",
                          description: "Name of the group where this item belongs to."
                        },
                        {
                          type: "object",
                          title: "Group Configuration",
                          description: "Detailed sidebar group configuration. It's enough when one of the pages of the group provides the detailed group configuration.",
                          additionalProperties: false,
                          required: ["label", "icon"],
                          properties: {
                            label: {
                              type: "string",
                              minLength: 1,
                              title: "Group Name",
                              description: "Name of the group."
                            },
                            "label:t": {
                              $ref: "#/definitions/t-key"
                            },
                            icon: {
                              $ref: "#/definitions/mdi-icon",
                              title: "Group Icon"
                            }
                          }
                        }
                      ]
                    },
                    invisible: {
                      title: "Hidden?",
                      description: "Set to true, to always hide the menu item in the sidebar (e.g. when multiple top-level pages belong to the same tab group), or use a Jexl expression to dynamically show/hide the menu item. The latter is especially useful when different user roles have access to different parts of the app.",
                      oneOf: [
                        {
                          type: "boolean"
                        },
                        {
                          $ref: "#/definitions/jexl-expr"
                        }
                      ]
                    },
                    position: {
                      type: "number",
                      title: "Group Position",
                      description: "Item position within group",
                      default: 5,
                    },
                    dynamic: {
                      type: "object",
                      title: "Dynamic Menu Item",
                      description: "Use a query to load data then set the menu item label or hidden property using a Jexl expression.",
                      additionalProperties: false,
                      required: ["data"],
                      properties: {
                        data: {
                          $ref: "#/definitions/data-reference"
                        },
                        label: {
                          $ref: "#/definitions/jexl-expr",
                          description: "Jexl Expression should return the label. Loaded data is available as 'data' in the Jexl expression context."
                        },
                        icon: {
                          $ref: "#/definitions/jexl-expr",
                          description: "Jexl Expression should return the MDI Icon name in kebab-case. Loaded data is available as 'data' in the Jexl expression context."
                        },
                        hidden: {
                          $ref: "#/definitions/jexl-expr",
                          description: "Jexl Expression should return true if the sidebar item is hidden. Loaded data is available as 'data' in the Jexl expression context."
                        }
                      }
                    }
                  }
                },
                title: {
                  $ref: "#/definitions/page-title"
                },
                "title:expr": {
                  $ref: "#/definitions/page-title-expr"
                },
                type: {
                  $ref: "#/definitions/page-type"
                },
                mainPage: {
                  $ref: "#/definitions/page-main-page"
                },
                breadcrumb: {
                  $ref: "#/definitions/page-breadcrumb"
                },
                "breadcrumb:t": {
                  $ref: "#/definitions/t-key"
                },
                tab: {
                  $ref: "#/definitions/page-tab"
                },
                props: {
                  $ref: "#/definitions/page-props"
                },
                "props:expr": {
                  $ref: "#/definitions/jexl-expr",
                  title: "Dynamic Page Props",
                  description: "A Jexl expression to dynamically define page props."
                },
                commands: {
                  $ref: "#/definitions/page-commands"
                },
                components: {
                  $ref: "#/definitions/page-components"
                }
              }
            },
            {
              type: "object",
              title: "Sub-Level Page",
              description: "Sub-Level pages are only accessible from page links on other pages. They usually have dynamic route parameters.",
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
                topLevel: {
                  type: "boolean",
                  const: false,
                  title: "This is a Sub-Level Page"
                },
                service: {
                  $ref: "#/definitions/service"
                },
                name: {
                  $ref: "#/definitions/page-name"
                },
                route: {
                  $ref: "#/definitions/page-route"
                },
                title: {
                  $ref: "#/definitions/page-title"
                },
                "title:expr": {
                  $ref: "#/definitions/page-title-expr"
                },
                type: {
                  $ref: "#/definitions/page-type"
                },
                mainPage: {
                  $ref: "#/definitions/page-main-page"
                },
                breadcrumb: {
                  $ref: "#/definitions/page-breadcrumb"
                },
                "breadcrumb:t": {
                  $ref: "#/definitions/t-key"
                },
                tab: {
                  $ref: "#/definitions/page-tab"
                },
                props: {
                  $ref: "#/definitions/page-props"
                },
                "props:expr": {
                  $ref: "#/definitions/jexl-expr",
                  title: "Dynamic Page Props",
                  description: "A Jexl expression to dynamically define page props."
                },
                commands: {
                  $ref: "#/definitions/page-commands"
                },
                components: {
                  $ref: "#/definitions/page-components"
                }
              }
            }
          ]
        }
      }
    }
  },
  definitions: {
    "service": {
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
    "page-name": {
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
    "page-route": {
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
    "page-title": {
      type: "string",
      title: "Page Title",
      description: "Appears as main heading (H1) on the page in the app. If not set, \"name\" is titleized and displayed instead."
    },
    "page-title-expr": {
      type: "string",
      title: "Dynamic Page Title",
      description: "Similar to \"title\", but uses Jexl to evaluate the given expression before displaying the result. In the Jexl Context you have access to: page, store, user, theme. See prooph board wiki for details about expressions: https://wiki.prooph-board.com/board_workspace/Expressions.html",
      examples: [
        "$> (user|role('Admin')) ? 'Hello Admin' : 'Hello User'",
        "$> page|data('/Crm/Customer')|get('name')"
      ]
    },
    "page-type": {
      type: "string",
      title: "Page Type",
      description: "Type of the page. If type is \"dialog\" or \"drawer\", the \"mainPage\" property should be set to the full qualified page name (Service.PageName) of the page where the dialog or drawer should appear.",
      enum: ["standard", "dialog", "drawer"],
      default: "standard"
    },
    "page-main-page": {
      type: "string",
      title: "Main Page",
      description: "Full qualified name of the page (Service.PageName) where a dialog or drawer should appear. See \"type\" property for details."
    },
    "page-breadcrumb": {
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
    },
    "page-tab": {
      type: "object",
      title: "Tab Group",
      description: "Organize multiple pages in tabs. Pages of same tab group belong together. Each page still has its own route. If you group multiple top-level pages in a tab group, make sure to show only the page of the first tab in the sidebar. Hide all other pages of the tab group in the sidebar.",
      additionalProperties: false,
      required: ["group", "label"],
      properties: {
        group: {
          type: "string",
          title: "Group Name",
          description: "Set the same name on all pages that belong to the tab group.",
          minLength: 1
        },
        label: {
          type: "string",
          title: "Tab Label",
          description: "Label of the tab for this particular page",
          minLength: 1
        },
        "label:t": {
          $ref: "#/definitions/t-key"
        },
        icon: {
          $ref: "#/definitions/mdi-icon",
          title: "Tab Icon"
        },
        style: {
          $ref: "#/definitions/mui-sx-prop"
        },
        styleExpr: {
          $ref: "#/definitions/jexl-expr",
          title: "Style Expression",
          description: "Jexl expression to dynamically style the tab"
        },
        hidden: {
          $ref: "#/definitions/jexl-expr",
          title: "Hidden?",
          description: "Return true from the Jexl expression to hide the tab. This is especially useful, when certain user roles don't have permission to view the tab."
        },
        disabled: {
          $ref: "#/definitions/jexl-expr",
          title: "Disabled?",
          description: "Return true from the Jexl expression to disable the tab."
        },
        position: {
          type: "number",
          title: "Position",
          description: "Position of tab within tab group. If not set, the position of the page within the page registry config defines tab ordering.",
          default: 5
        }
      }
    },
    "page-props": {
      type: "object",
      title: "UI Page Props",
      description: "Can be used like this:\n1. the property 'container' is passed to the [MUI Grid container](https://v5.mui.com/system/react-grid/) that represents the page in the UI, so you can for example customize the Grid layout or use the 'sx' property for custom styling within the container.",
      properties: {
        container: {
          type: "object",
          title: "MUI Grid Container Props",
          description: "[MUI Grid container](https://v5.mui.com/system/react-grid/) passed to the react component of the page. Use it to customize the Grid layout of the page and/or customize styling using the 'sx' prop.",
          examples: [
            {
              spacing: 4,
              sx: {
                border: "1px solid grey"
              }
            }
          ]
        }
      }
    },
    "page-commands": {
      type: "array",
      title: "Commands",
      description: "Action buttons visible on the page.",
      items: {
        oneOf: [
          {
            type: "string",
            title: "Command Name",
            description: "Full qualified command name in the format: [Service].[CommandName]"
          },
          {
            $ref: "#/definitions/action"
          }
        ]
      }
    },
    "page-components": {
      title: "Page Components",
      description: "Defines one or more view components to be rendered on a page. A component can be a shorthand string reference of a view name in th format: [Service].[ViewName] or a detailed object configuration.",
      type: "array",
      items: {
        oneOf: [
          {
            type: "string",
            title: "View Component Reference",
            description: "Simple string shorthand referencing a view by name in the format: [Service].[ViewName]",
            examples: ["Crm.CustomerList", "App.OrderDetails"]
          },
          {
            type: "object",
            title: "View Component Configuration",
            additionalProperties: false,
            required: ["view"],
            properties: {
              view: {
                type: "string",
                title: "View",
                description: "Name of the registered view component. Format: [Service].[ViewName]"
              },
              hidden: {
                type: "boolean",
                title: "Hidden?",
                description: "If true, the component will not be rendered."
              },
              "hidden:expr": {
                $ref: "#/definitions/jexl-expr",
                title: "Dynamic Hidden",
                description: "Jexl expression that resolves to a boolean to dynamically hide the component."
              },
              props: {
                type: "object",
                title: "Props",
                description: "Can be used for two different things:\n1. the property 'container' is passed to the [MUI Grid item](https://v5.mui.com/system/react-grid/) inside the page grid container that contains the rendered view, so you can for example customize the Grid layout or use the 'sx' property for custom styling within the grid item.\n\n2. All other properties are merged into route params. This allows you set fix values for route parameters that are used for querying data on the page.",
                patternProperties: {
                  "^container$": {
                    type: "object",
                    title: "MUI Grid Container Props",
                    description: "[MUI Grid item](https://v5.mui.com/system/react-grid/) passed to the react Grid component that contains the rendered view. Use it to customize the Grid column layout and/or customize styling using the 'sx' prop.",
                    examples: [
                      {
                        xs: 12,
                        md: 6,
                        sx: {
                          border: "1px solid grey"
                        }
                      }
                    ]
                  },
                  "^(?!container$).+": {
                    type: "string",
                    title: "Route Parameter Override",
                    description: "All non container properties are merged into route params. This allows you set fixed values for route parameters that are used for querying the data of the view."
                  }
                }
              },
              "props:expr": {
                $ref: "#/definitions/prop-mapping",
                title: "Dynamic Props",
                description: "Jexl-based property mapping for dynamic props."
              },
              uiSchema: {
                $ref: "#/definitions/ui-schema",
                title: "UI Schema",
                description: "Optional react-jsonschema-form UI Schema configuration for components. All single object view components are based on react-jsonschema-form. If data is only displayed, a readonly rjsf form is rendered. The readonly from gets the class '.stateview' assigned, and the MUI theme contains customized styling for this class, so that form controls are hidden and the form looks like a readonly view."
              },
              type: {
                type: "string",
                title: "Component Type",
                description: "Explicit component type.",
                enum: ["auto", "state", "form", "table", "list"],
                default: "auto"
              },
              "type:expr": {
                $ref: "#/definitions/jexl-expr",
                title: "Dynamic Component Type",
                description: "Jexl expression resolving to a component type."
              },
              loadState: {
                type: "boolean",
                title: "Load State",
                description: "If true, automatically load the component state."
              },
              data: {
                $ref: "#/definitions/prop-mapping",
                title: "Data",
                description: "Data binding for the component."
              }
            },
            examples: [
              {
                view: "App.ProjectDetails",
                type: "form",
                uiSchema: {
                  "customer": {
                    "ui:widget": "DataSelect",
                    "ui:options": {
                      data: "/App/Customers",
                      label: "$> data.customerName",
                      value: "$> data.customerId"
                    }
                  }
                }
              },
              {
                view: "App.OrderTable",
                type: "table",
                uiSchema: {
                  "ui:table": {
                    "columns": [
                      {
                        field: "orderId",
                        headerName: "ID"
                      },
                      {
                        field: "orderedAt",
                        headerName: "Order Date"
                      },
                      {
                        field: "shippedAt",
                        headerName: "Shipping Date"
                      }
                    ]
                  }
                }
              },
              {
                view: "App.ProjectState",
                type: "state",
                "hidden:expr": "$> !user|role('Admin')"
              }
            ]
          }
        ]
      }
    },
    "action": {
      title: "Action",
      description: "Defines an action triggered from the UI (button or form).",
      oneOf: [
        { $ref: "#/definitions/link-action" },
        { $ref: "#/definitions/command-action" },
        { $ref: "#/definitions/rules-action" },
        { $ref: "#/definitions/form-action" }
      ]
    },
    "base-action": {
      type: "object",
      title: "Base Action",
      description: "Base properties shared by all actions.",
      required: ["type", "position"],
      properties: {
        type: {
          type: "string",
          enum: ["command", "link", "rules", "form"],
          title: "Action Type"
        },
        description: {
          type: "string",
          title: "Description",
          description: "Optional description of the action."
        },
        position: { $ref: "#/definitions/button-position" }
      }
    },
    "button-action": {
      allOf: [
        { $ref: "#/definitions/base-action" },
        {
          type: "object",
          title: "Button Action",
          description: "Base action extended with button configuration.",
          required: ["button"],
          properties: {
            button: { $ref: "#/definitions/button-config" }
          }
        }
      ]
    },
    "link-action": {
      allOf: [
        { $ref: "#/definitions/button-action" },
        {
          type: "object",
          title: "Link Action",
          description: "Action that navigates to another page or URL.",
          properties: {
            type: { const: "link" },
            pageLink: {
              oneOf: [
                { type: "string", title: "Page Name" },
                {
                  type: "object",
                  required: ["page", "mapping"],
                  properties: {
                    page: { type: "string" },
                    mapping: {
                      type: "object",
                      additionalProperties: { $ref: "#/definitions/jexl-expr" }
                    }
                  }
                }
              ]
            },
            href: { type: "string", format: "uri", title: "External Link" }
          }
        }
      ],
      examples: [
        {
          type: "link",
          position: "top-right",
          button: { label: "Go to Customers" },
          pageLink: "Crm.Customers"
        },
        {
          type: "link",
          position: "bottom-right",
          button: { label: "Open Docs" },
          href: "https://example.com/docs"
        }
      ]
    },
    "command-action": {
      allOf: [
        { $ref: "#/definitions/button-action" },
        {
          type: "object",
          title: "Command Action",
          description: "Action that triggers a command.",
          required: ["command"],
          properties: {
            type: { const: "command" },
            command: { type: "string", title: "Command Name", description: "Full qualified command name in the format: [Service].[CommandName]" },
            uiSchema: { $ref: "#/definitions/ui-schema" },
            connectTo: {
              type: "string",
              title: "Connect To",
              description: "Connect the button to a form on the page. A view of type: 'form' is registered on the page as '/Form/ViewName'. So if you have a view component like 'App.Customer' with {type: 'form'} configured on the same page as the command action, you can connect the action to '/Form/Customer'. The action button becomes a submit button and the form data is used as command payload."
            },
            directSubmit: { type: "boolean", title: "Direct Submit?", description: "If set to true, a click on the button will submit the command directly without showing the command form in a dialog. This is useful when you want to submit data that is set programmatically using the 'data' property mapping config" },
            forceSchema: { type: "boolean", title: "Force Schema?", description: "If set to true and the command action is connected to a form on the page, the schema of the command is used to validate form data. This is useful, when you have a form and two different commands connected to it. One command is used for intermediate save of incomplete data, so it has a schema with optional properties, while a second command is used to save the final data, hence it has a stricter schema and causes validation errors, when the user tries to submit incomplete data as final data." },
            data: {
              $ref: "#/definitions/prop-mapping",
              title: "Initial Data",
              description: `Use property mapping to set the initial command form data when the command button is clicked.\n\n${FORM_JEXL_CTX}`
            }
          }
        }
      ],
      examples: [
        {
          type: "command",
          position: "bottom-right",
          button: { label: "Add Customer" },
          command: "Crm.AddCustomer"
        }
      ]
    },
    "rules-action": {
      allOf: [
        { $ref: "#/definitions/button-action" },
        {
          type: "object",
          title: "Rules Action",
          description: "Action that executes a ruleset.",
          required: ["rules"],
          properties: {
            type: { const: "rules" },
            rules: {
              type: "array",
              items: { $ref: "#/definitions/rule" }
            }
          }
        }
      ],
      examples: [
        {
          type: "rules",
          position: "bottom-center",
          button: { label: "Run Check" },
          rules: [
            {
              rule: "always",
              then: { log: { msg: "Check executed" } }
            }
          ]
        }
      ]
    },
    "form-action": {
      allOf: [
        { $ref: "#/definitions/base-action" },
        {
          type: "object",
          title: "Form Action",
          description: "Action that displays a form.",
          required: ["name", "schema"],
          properties: {
            type: { const: "form" },
            name: { type: "string" },
            schema: { $ref: "#/definitions/json-schema7" },
            uiSchema: { $ref: "#/definitions/ui-schema" },
            scope: { enum: ["page", "global"], default: "page" }
          }
        }
      ],
      examples: [
        {
          type: "form",
          position: "top-right",
          name: "CustomerFeedback",
          schema: {
            type: "object",
            required: ["feedback"],
            properties: {
              feedback: { type: "string" }
            }
          },
          scope: "global"
        }
      ]
    },
    "button-position": {
      type: "string",
      title: "Button Position",
      description: "Defines the button placement in the UI.",
      enum: ["top-right", "bottom-left", "bottom-center", "bottom-right"],
      default: "top-right"
    },
    "button-config": {
      type: "object",
      title: "Button Configuration",
      description: "Configuration for rendering an action button in the UI.",
      additionalProperties: false,
      properties: {
        variant: {
          type: "string",
          enum: ["text", "outlined", "contained"],
          title: "Variant",
          description: "MUI button variant."
        },
        color: {
          type: "string",
          enum: [
            "inherit",
            "primary",
            "secondary",
            "success",
            "error",
            "info",
            "warning",
            "default"
          ],
          title: "Color",
          description: "MUI button color."
        },
        className: {
          type: "string",
          title: "CSS Class",
          description: "Optional CSS class for styling the button."
        },
        disabled: {
          type: "boolean",
          title: "Disabled",
          description: "If true, the button will be disabled."
        },
        style: {
          $ref: "#/definitions/mui-sx-prop",
          title: "Style",
          description: "MUI sx style object applied to the button."
        },
        hidden: {
          type: "boolean",
          title: "Hidden",
          description: "If true, the button will not be rendered."
        },
        icon: {
          $ref: "#/definitions/mdi-icon",
          title: "Icon",
          description: "MDI Icon name or identifier for the start icon."
        },
        label: {
          type: "string",
          title: "Label",
          description: "Text label of the button."
        },
        endIcon: {
          $ref: "#/definitions/mdi-icon",
          title: "End Icon",
          description: "MDI Icon name or identifier for the end icon."
        },
        /* Expression-based overrides */
        "variant:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Variant",
          description: "Jexl expression resolving to a variant value."
        },
        "color:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Color",
          description: "Jexl expression resolving to a color value."
        },
        "disabled:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Disabled",
          description: "Jexl expression resolving to a boolean disabled value."
        },
        "style:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Style",
          description: "Jexl expression resolving to a MUI sx style object."
        },
        "hidden:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Hidden",
          description: "Jexl expression resolving to a boolean hidden value."
        },
        "icon:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Icon",
          description: "Jexl expression resolving to an icon identifier."
        },
        "label:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic Label",
          description: "Jexl expression resolving to a string label."
        },
        "endIcon:expr": {
          $ref: "#/definitions/jexl-expr",
          title: "Dynamic End Icon",
          description: "Jexl expression resolving to an icon identifier."
        },

        /* DataGrid specific options */
        asGridActionsCellItem: {
          type: "boolean",
          title: "As Grid Actions Cell Item",
          description:
            "If true, the button is rendered inside a MUI DataGrid actions cell."
        },
        showInMenu: {
          type: "boolean",
          title: "Show in Menu",
          description: "If true, the button will be displayed in the grid action menu."
        }
      },
      examples: [
        {
          variant: "contained",
          color: "primary",
          label: "Save",
          icon: "content-save",
          "disabled:expr": "$> !form.valid",
          asGridActionsCellItem: true
        },
        {
          variant: "outlined",
          label: "Delete",
          color: "error",
          endIcon: "delete",
          showInMenu: true
        }
      ]
    },
    "mdi-icon": {
      type: "string",
      title: "Icon",
      description: "A valid [MDI Icon](https://pictogrammers.com/library/mdi/) name in kebab case (e.g. arrow-down-thin)",
      default: "square"
    },
    "mui-sx-prop": {
      type: "object",
      title: "MUI Styling",
      description: "CSS superset with access to MUI theme. See [MUI sx prop](https://v5.mui.com/system/getting-started/the-sx-prop/) for details."
    },
    "t-key": {
      type: "string",
      title: "Translation Key",
      description: "Translations are managed in JSON structures. Use '.' for nested translation keys. Translation keys are optional and override the main property. For example 'label' is the main property and 'label:t' overrides the main property, if it is set.",
      examples: [
        "form.save",
        "form.cancel",
        "sidebar.customers",
        "sidebar.projects",
        "page.customerOverview.headline"
      ]
    },
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
        },
        {
          $ref: "#/definitions/rule-then-find-partial-information"
        },
        {
          $ref: "#/definitions/rule-then-find-information-by-id"
        },
        {
          $ref: "#/definitions/rule-then-find-one-information"
        },
        {
          $ref: "#/definitions/rule-then-find-partial-information-by-id"
        },
        {
          $ref: "#/definitions/rule-then-find-one-partial-information"
        },
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
                log: {msg: "Payment failed"}
              }
            },
            finally: {
              then: {
                log: {msg: "Payment attempt finished"}
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
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            filter: {$ref: "#/definitions/filter"},
            skip: {
              type: "integer",
              minimum: 0
            },
            limit: {
              type: "integer",
              minimum: 1
            },
            orderBy: {
              type: "array",
              title: "Order By",
              description: "Define the sort order",
              items: {
                $ref: "#/definitions/sort-order"
              }
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
              eq: {prop: "status", value: "$> query.status"}
            },
            skip: 0,
            limit: 10,
            orderBy: [{prop: "createdAt", sort: "desc"}],
            variable: "pendingOrders"
          }
        },
        {
          find: {
            information: "customers",
            filter: {
              and: [
                {like: {prop: "name", value: "$> 'John%'"}},
                {gte: {prop: "age", value: "$> 21"}}
              ]
            },
            variable: "adultJohns"
          }
        }
      ]
    },
    "rule-then-find-partial-information": {
      type: "object",
      title: "Find Partial Information",
      description: "Query information with partial field selection, filter, and ordering options.",
      additionalProperties: false,
      required: ["findPartial"],
      properties: {
        findPartial: {
          type: "object",
          additionalProperties: false,
          required: ["information", "select", "filter"],
          properties: {
            information: {
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            select: {$ref: "#/definitions/partial-select"},
            filter: {$ref: "#/definitions/filter"},
            skip: {type: "integer", minimum: 0},
            limit: {type: "integer", minimum: 1},
            orderBy: {
              type: "array",
              items: {$ref: "#/definitions/sort-order"}
            },
            variable: {type: "string"}
          }
        }
      },
      examples: [
        {
          findPartial: {
            information: "Crm.Customers",
            select: ["id", {field: "name", alias: "customerName"}],
            filter: {like: {prop: "name", value: "$> 'A%'"}},
            limit: 5,
            orderBy: [{prop: "name", sort: "asc"}],
            variable: "customersStartingWithA"
          }
        },
        {
          findPartial: {
            information: "Shopping.Orders",
            select: [
              "id",
              {field: "total", alias: "orderTotal"},
              {
                lookup: "Crm.Customers",
                alias: "customer",
                on: {localKey: "customerId", foreignKey: "id"},
                select: ["name", "email"]
              }
            ],
            filter: {gte: {prop: "total", value: "$> 100"}},
            variable: "bigOrdersWithCustomer"
          }
        }
      ]
    },
    "rule-then-find-information-by-id": {
      type: "object",
      title: "Find Information By Id",
      description: "Query a single document by id.",
      additionalProperties: false,
      required: ["findById"],
      properties: {
        findById: {
          type: "object",
          additionalProperties: false,
          required: ["information", "id"],
          properties: {
            information: {
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            id: {
              $ref: "#/definitions/jexl-expr",
            },
            variable: {type: "string"}
          }
        }
      },
      examples: [
        {
          findById: {
            information: "Crm.Customers",
            id: "$> query.customerId",
            variable: "customer"
          }
        }
      ]
    },
    "rule-then-find-one-information": {
      type: "object",
      title: "Find One Information",
      description: "Query a single document matching a filter.",
      additionalProperties: false,
      required: ["findOne"],
      properties: {
        findOne: {
          type: "object",
          additionalProperties: false,
          required: ["information", "filter"],
          properties: {
            information: {
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            filter: {$ref: "#/definitions/filter"},
            variable: {type: "string"}
          }
        }
      },
      examples: [
        {
          findOne: {
            information: "Shopping.Orders",
            filter: {eq: {prop: "status", value: "$> 'open'"}},
            variable: "firstOpenOrder"
          }
        }
      ]
    },
    "rule-then-find-partial-information-by-id": {
      type: "object",
      title: "Find Partial Information By Id",
      description: "Query a single document by id with partial field selection.",
      additionalProperties: false,
      required: ["findPartialById"],
      properties: {
        findPartialById: {
          type: "object",
          additionalProperties: false,
          required: ["information", "id", "select"],
          properties: {
            information: {
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            id: {
              $ref: "#/definitions/jexl-expr",
            },
            select: {$ref: "#/definitions/partial-select"},
            variable: {type: "string"}
          }
        }
      },
      examples: [
        {
          findPartialById: {
            information: "Shopping.Orders",
            id: "$> query.orderId",
            select: ["id", "status", {field: "total", alias: "orderTotal"}],
            variable: "orderSummary"
          }
        }
      ]
    },
    "rule-then-find-one-partial-information": {
      type: "object",
      title: "Find One Partial Information",
      description: "Query a single document with partial field selection matching a filter.",
      additionalProperties: false,
      required: ["findOnePartial"],
      properties: {
        findOnePartial: {
          type: "object",
          additionalProperties: false,
          required: ["information", "select", "filter"],
          properties: {
            information: {
              $ref: "#/definitions/data-reference",
              title: "Information",
              description: "The information resource to query."
            },
            select: {$ref: "#/definitions/partial-select"},
            filter: {$ref: "#/definitions/filter"},
            variable: {type: "string"}
          }
        }
      },
      examples: [
        {
          findOnePartial: {
            information: "Crm.Customers",
            select: ["id", "name", "email"],
            filter: {eq: {prop: "email", value: "$> meta.user.email"}},
            variable: "currentCustomer"
          }
        }
      ]
    },
    "filter": {
      title: "Filter",
      description: "Filter definition for querying information.",
      oneOf: [
        {$ref: "#/definitions/and-filter"},
        {$ref: "#/definitions/or-filter"},
        {$ref: "#/definitions/not-filter"},
        {$ref: "#/definitions/any-filter"},
        {$ref: "#/definitions/any-of-doc-id-filter"},
        {$ref: "#/definitions/any-of-filter"},
        {$ref: "#/definitions/doc-id-filter"},
        {$ref: "#/definitions/eq-filter"},
        {$ref: "#/definitions/exists-filter"},
        {$ref: "#/definitions/gte-filter"},
        {$ref: "#/definitions/gt-filter"},
        {$ref: "#/definitions/in-array-filter"},
        {$ref: "#/definitions/like-filter"},
        {$ref: "#/definitions/lte-filter"},
        {$ref: "#/definitions/lt-filter"}
      ]
    },
    "and-filter": {
      type: "object",
      required: ["and"],
      properties: {
        and: {
          type: "array",
          items: {$ref: "#/definitions/filter"}
        }
      }
    },
    "or-filter": {
      type: "object",
      required: ["or"],
      properties: {
        or: {
          type: "array",
          items: {$ref: "#/definitions/filter"}
        }
      }
    },
    "not-filter": {
      type: "object",
      required: ["not"],
      properties: {
        not: {$ref: "#/definitions/filter"}
      }
    },
    "any-filter": {
      type: "object",
      required: ["any"],
      title: "Any Filter",
      description: "Matches any document.",
      properties: {
        any: {type: "boolean", default: true}
      }
    },
    "any-of-doc-id-filter": {
      type: "object",
      required: ["anyOfDocId"],
      title: "Any of DocId Filter",
      description: "Jexl expression should evaluate to an array of document ids. The filter will match all documents with ids in that list.",
      properties: {
        anyOfDocId: {
          $ref: "#/definitions/jexl-expr",
        }
      }
    },
    "any-of-filter": {
      type: "object",
      required: ["anyOf"],
      title: "Any of Filter",
      description: "The filter will match all documents with prop value being in the value list returned by the Jexl expression.",
      properties: {
        anyOf: {
          type: "object",
          required: ["prop", "valueList"],
          properties: {
            prop: {type: "string"},
            valueList: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "doc-id-filter": {
      type: "object",
      required: ["docId"],
      title: "Document Id Filter",
      description: "Matches the given document id returned by the Jexl expression.",
      properties: {
        docId: {
          $ref: "#/definitions/jexl-expr",
        }
      }
    },
    "eq-filter": {
      type: "object",
      required: ["eq"],
      title: "Equal Filter",
      description: "Matches all documents where prop value equals return value of Jexl expression",
      properties: {
        eq: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "exists-filter": {
      type: "object",
      required: ["exists"],
      title: "Exists Filter",
      description: "Matches all documents that have prop defined.",
      properties: {
        exists: {
          type: "object",
          required: ["prop"],
          properties: {
            prop: {type: "string"}
          }
        }
      }
    },
    "gte-filter": {
      type: "object",
      required: ["gte"],
      title: "Greater Than or Equal Filter",
      description: "Matches all documents where prop is greater than or equal to value returned by the Jexl expression.",
      properties: {
        gte: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "gt-filter": {
      type: "object",
      required: ["gt"],
      title: "Greater Than Filter",
      description: "Matches all documents where prop is greater than value returned by Jexl expression.",
      properties: {
        gt: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "in-array-filter": {
      type: "object",
      required: ["inArray"],
      title: "In-Array Filter",
      description: "Matches all documents where prop is an array and contains the value returned by the Jexl expression.",
      properties: {
        inArray: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "like-filter": {
      type: "object",
      required: ["like"],
      title: "Like Filter",
      description: "Matches all documents where prop is like the value returned by the Jexl expression. % sign can be used as a wildcard before and/or after the substring.",
      properties: {
        like: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "lte-filter": {
      type: "object",
      required: ["lte"],
      title: "Lower Than or Equal Filter",
      description: "Matches all documents where prop is lower than or equal to the value returned by the Jexl expression.",
      properties: {
        lte: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "lt-filter": {
      type: "object",
      required: ["lt"],
      title: "Lower Than Filter",
      description: "Matches all documents where prop is lower than the value returned by the Jexl Expression.",
      properties: {
        lt: {
          type: "object",
          required: ["prop", "value"],
          properties: {
            prop: {type: "string"},
            value: {
              $ref: "#/definitions/jexl-expr",
            }
          }
        }
      }
    },
    "sort-order": {
      type: "object",
      additionalProperties: false,
      required: ["prop", "sort"],
      properties: {
        prop: {
          type: "string",
          title: "Property",
          description: "Name of the property to be sorted"
        },
        sort: {
          type: "string",
          title: "Sorting",
          description: "Ascending (asc) or descending (desc) sorting",
          enum: ["asc", "desc"]
        }
      }
    },
    "field-name": {
      type: "string",
      title: "Field Name",
      description: "A property name to be selected."
    },
    "alias-field-name-mapping": {
      type: "object",
      title: "Alias Field Mapping",
      description: "Map a field to an alias name in the result set.",
      required: ["field", "alias"],
      properties: {
        field: {type: "string"},
        alias: {type: "string"}
      }
    },
    "partial-select": {
      type: "array",
      title: "Partial Select",
      description: "Defines which fields and lookups to select.",
      items: {
        oneOf: [
          {$ref: "#/definitions/field-name"},
          {$ref: "#/definitions/alias-field-name-mapping"},
          {$ref: "#/definitions/lookup"}
        ]
      }
    },
    "lookup": {
      type: "object",
      title: "Lookup",
      description: "Perform a join-like lookup to another collection.",
      required: ["lookup", "on"],
      properties: {
        lookup: {
          $ref: "#/definitions/data-reference",
          title: "Lookup",
          description: "The information resource to look up."
        },
        alias: {type: "string", title: "Alias", description: "Define an alias for the looked up information."},
        using: {
          type: "string",
          title: "Using",
          description: "Use another looked up information (or its alias) as the local (base) information."
        },
        optional: {
          type: "boolean",
          default: false,
          title: "Is optional lookup?",
          description: "If lookup is otpional, the local select is included in resultset even if looked up information cannot be found."
        },
        on: {
          type: "object",
          required: ["localKey"],
          properties: {
            localKey: {type: "string"},
            foreignKey: {type: "string"},
            and: {
              $ref: "#/definitions/filter",
              title: "Additional Filter",
              description: "Optional filter condition that should match additionally to the local key -> foreign key match."
            }
          }
        },
        select: {
          type: "array",
          title: "Select",
          description: "Fields of lookup to be included in the resultset.",
          items: {
            oneOf: [
              {$ref: "#/definitions/field-name"},
              {$ref: "#/definitions/alias-field-name-mapping"}
            ]
          }
        }
      }
    },
    "json-schema7": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "http://json-schema.org/draft-07/schema#",
      "title": "Core schema meta-schema",
      "type": ["object", "boolean"],
      "properties": {
        "$id": {
          "type": "string",
          "format": "uri-reference"
        },
        "$schema": {
          "type": "string",
          "format": "uri"
        },
        "$ref": {
          "type": "string",
          "format": "uri-reference"
        },
        "$comment": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "default": true,
        "examples": {
          "type": "array",
          "items": true
        },
        "multipleOf": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "maximum": {
          "type": "number"
        },
        "exclusiveMaximum": {
          "type": "number"
        },
        "minimum": {
          "type": "number"
        },
        "exclusiveMinimum": {
          "type": "number"
        },
        "maxLength": {
          "type": "integer",
          "minimum": 0
        },
        "minLength": {
          "type": "integer",
          "minimum": 0,
          "default": 0
        },
        "pattern": {
          "type": "string",
          "format": "regex"
        },
        "additionalItems": { "$ref": "#" },
        "items": {
          "anyOf": [
            { "$ref": "#" },
            {
              "type": "array",
              "items": { "$ref": "#" },
              "minItems": 1
            }
          ],
          "default": true
        },
        "maxItems": {
          "type": "integer",
          "minimum": 0
        },
        "minItems": {
          "type": "integer",
          "minimum": 0,
          "default": 0
        },
        "uniqueItems": {
          "type": "boolean",
          "default": false
        },
        "contains": { "$ref": "#" },
        "maxProperties": {
          "type": "integer",
          "minimum": 0
        },
        "minProperties": {
          "type": "integer",
          "minimum": 0,
          "default": 0
        },
        "required": {
          "type": "array",
          "items": { "type": "string" },
          "uniqueItems": true,
          "default": []
        },
        "additionalProperties": { "$ref": "#" },
        "definitions": {
          "type": "object",
          "additionalProperties": { "$ref": "#" },
          "default": {}
        },
        "properties": {
          "type": "object",
          "additionalProperties": { "$ref": "#" },
          "default": {}
        },
        "patternProperties": {
          "type": "object",
          "additionalProperties": { "$ref": "#" },
          "propertyNames": { "format": "regex" },
          "default": {}
        },
        "dependencies": {
          "type": "object",
          "additionalProperties": {
            "anyOf": [
              { "$ref": "#" },
              {
                "type": "array",
                "items": { "type": "string" },
                "uniqueItems": true,
                "minItems": 1
              }
            ]
          }
        },
        "propertyNames": { "$ref": "#" },
        "const": true,
        "enum": {
          "type": "array",
          "items": true,
          "minItems": 1,
          "uniqueItems": true
        },
        "type": {
          "anyOf": [
            { "enum": ["array", "boolean", "integer", "null", "number", "object", "string"] },
            {
              "type": "array",
              "items": { "enum": ["array", "boolean", "integer", "null", "number", "object", "string"] },
              "minItems": 1,
              "uniqueItems": true
            }
          ]
        },
        "format": { "type": "string" },
        "contentMediaType": { "type": "string" },
        "contentEncoding": { "type": "string" }
      },
      "default": true
    },
    "ui-schema": {
      title: "RJSF uiSchema",
      description: "User-interface schema for [react-jsonschema-form (v5)](https://rjsf-team.github.io/react-jsonschema-form/docs/version-5.24.10/api-reference/uiSchema).",
      type: "object",
      additionalProperties: {
        oneOf: [
          { $ref: "#/definitions/ui-schema-field" },
          true  // allow arbitrary extra properties (for nested sections, etc.)
        ]
      }
    },
    "ui-schema-field": {
      type: "object",
      description: "Schema for a single field or nested object in uiSchema",
      additionalProperties: {
        // keys like "ui:widget", "ui:options", etc.
        oneOf: [
          { $ref: "#/definitions/ui-option-value" },
          { $ref: "#/definitions/ui-schema-field" },
          true
        ]
      },
      properties: {
        "ui:widget": {
          description: "Override widget for this field",
          oneOf: [
            { type: "string" },
            { type: "object" }  // allow custom widget object
          ]
        },
        "ui:field": {
          description: "Override field component",
          oneOf: [
            { type: "string" },
            { type: "object" }
          ]
        },
        "ui:options": {
          type: "object",
          description: "Options passed to the widget",
          additionalProperties: true
        },
        "ui:classNames": {
          type: "string"
        },
        "ui:style": {
          type: "object",
          additionalProperties: true
        },
        "ui:autofocus": {
          type: "boolean"
        },
        "ui:placeholder": {
          type: ["string", "number"]
        },
        "ui:help": {
          type: "string"
        },
        "ui:description": {
          type: "string"
        },
        "ui:disabled": {
          type: "boolean"
        },
        "ui:readonly": {
          type: "boolean"
        },
        "ui:hidden": {
          type: "boolean"
        },
        // anyOf / oneOf uiSchema customization
        "anyOf": {
          type: "array",
          items: { $ref: "#/definitions/ui-schema-field" }
        },
        "oneOf": {
          type: "array",
          items: { $ref: "#/definitions/ui-schema-field" }
        },
        "ui:rootFieldId": {
          type: "string"
        }
      },
      allOf: [
        {
          if: {
            properties: { "ui:widget": { const: "DataSelect" } },
            required: ["ui:widget"]
          },
          then: {
            properties: {
              "ui:options": {
                type: "object",
                required: ["data", "label", "value"],
                additionalProperties: false,
                properties: {
                  data: {
                    $ref: "#/definitions/data-reference",
                    description: "Query a list of entities to populate the select."
                  },
                  label: {
                    $ref: "#/definitions/jexl-expr",
                    description:
                      "Jexl expression evaluated per option. Should resolve to the option label."
                  },
                  value: {
                    $ref: "#/definitions/jexl-expr",
                    description:
                      "Jexl expression evaluated per option. Should resolve to the option value."
                  }
                }
              }
            }
          }
        }
      ]
    },
    "ui-option-value": {
      description: "Allowed value in ui:options or a ui:* key",
      oneOf: [
        { type: "boolean" },
        { type: "string" },
        { type: "number" },
        { type: "object", additionalProperties: true },
        { type: "array", items: true }
      ]
    }
  },
};
