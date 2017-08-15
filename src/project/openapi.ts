export default {
    'x-ecmal' : {
        controllers : '@vendor/project/actions',
        definitions : '@vendor/project/models'
    },

    swagger: "2.0",
    schemes: ["http"],
    host: "petstore.swagger.io",
    basePath: "/api/v2",
    info: {
        description: "This is a sample OpenAPI server",
        version: "1.0.0",
        title: "OpenApi Server",
        contact: {email: "apiteam@ffn.li"},
        license: {name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0.html"}
    },
    securityDefinitions: {
        oauth: {
            type: "oauth2",
            authorizationUrl: "http://petstore.swagger.io/oauth/dialog",
            flow: "implicit",
            scopes: {
                "write:pets": "modify pets in your account",
                "read:pets": "read your pets"
            }
        },
        api_key: {
            in: "header",
            type: "apiKey",
            name: "api_key"
        }
    },

    tags: [{
        name: "Users",
        description: "Operations about user"
    }],
    paths: {
        "/user": {
            get: {
                tags: ["Users"],
                summary: "Search user in system",
                description: "Search user in system",
                operationId: "getUsers",
                parameters: [{
                    name: "status",
                    in: "query",
                    description: "The name that needs to be fetched. Use user1 for testing. ",
                    type: "string"
                }],
                responses: {
                    200: {"description": "successful operation", "schema": {"$ref": "#/definitions/User"}},
                    400: {"description": "Invalid username supplied"},
                    404: {"description": "User not found"}
                }
            },
            post: {
                tags: ["Users"],
                summary: "Create user",
                description: "This can only be done by the logged in user.",
                operationId: "createUser",
                parameters: [{
                    in: "body",
                    name: "body",
                    description: "Created user object",
                    required: true,
                    schema: {"$ref": "#/definitions/User"}
                }],
                responses: {
                    default: {"description": "successful operation"}
                }
            }
        },
        "/user/{username}": {
            get: {
                tags: ["Users"],
                summary: "Get user by user name",
                description: "Get user by user name",
                operationId: "getUser",
                parameters: [{
                    name: "username",
                    in: "path",
                    description: "The name that needs to be fetched. Use user1 for testing. ",
                    required: true,
                    type: "string"
                }],
                responses: {
                    200: {"description": "successful operation", "schema": {"$ref": "#/definitions/User"}},
                    400: {"description": "Invalid username supplied"},
                    404: {"description": "User not found"}
                }
            },
            put: {
                tags: ["Users"],
                summary: "Updated user",
                description: "This can only be done by the logged in user.",
                operationId: "updateUser",
                parameters: [{
                    name: "username",
                    in: "path",
                    description: "name that need to be updated",
                    required: true,
                    type: "string"
                }, {
                    in: "body",
                    name: "body",
                    description: "Updated user object",
                    required: true,
                    schema: {"$ref": "#/definitions/User"}
                }],
                responses: {
                    400: {description: "Invalid user supplied"},
                    404: {description: "User not found"}
                }
            },
            delete: {
                tags: ["Users"],
                summary: "Delete user",
                description: "This can only be done by the logged in user.",
                operationId: "deleteUser",
                parameters: [{
                    name: "username",
                    in: "path",
                    description: "The name that needs to be deleted",
                    required: true,
                    type: "string"
                }],
                responses: {
                    400: {description: "Invalid username supplied"},
                    404: {description: "User not found"}
                }
            }
        }
    },
    definitions: {
        User: {
            type: "object",
            properties: {
                id: {type: "integer", format: "int64"},
                username: {type: "string"},
                firstName: {type: "string"},
                lastName:{type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                phone: {type: "string"},
                status: {type: "integer", format: "int32"}
            }
        },
        Error: {
            type: "object",
            properties: {
                code: {type: "integer", format: "int32"},
                type: {type: "string"},
                message: {type: "string"}
            }
        }
    }
}