module.exports = {
  "openapi": "3.0.3",
  "info": {
    "title": "linux-lab-progress",
    "version": "1.0.0",
    "description": "Account-owned course progress and preferences API"
  },
  "servers": [
    {
      "url": "http://localhost:5000"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "Error": {
        "type": "object",
        "required": [
          "error"
        ],
        "properties": {
          "error": {
            "type": "string"
          }
        },
        "example": {
          "error": "Resource not found"
        }
      },
      "ProgressCreate": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "completed": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "exercises": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "bookmarks": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "lastLesson": {
            "type": "string",
            "maxLength": 100,
            "example": "example"
          },
          "revision": {
            "type": "integer",
            "example": 1
          },
          "preferences": {
            "type": "object",
            "additionalProperties": true,
            "example": {
              "key": "value"
            }
          }
        },
        "required": [
          "completed",
          "exercises",
          "bookmarks",
          "lastLesson",
          "revision",
          "preferences"
        ],
        "example": {
          "completed": [
            "example"
          ],
          "exercises": [
            "example"
          ],
          "bookmarks": [
            "example"
          ],
          "lastLesson": "example",
          "revision": 1,
          "preferences": {
            "key": "value"
          }
        }
      },
      "ProgressUpdate": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "completed": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "exercises": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "bookmarks": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "lastLesson": {
            "type": "string",
            "maxLength": 100,
            "example": "example"
          },
          "revision": {
            "type": "integer",
            "example": 1
          },
          "preferences": {
            "type": "object",
            "additionalProperties": true,
            "example": {
              "key": "value"
            }
          }
        },
        "example": {
          "completed": [
            "example"
          ],
          "exercises": [
            "example"
          ],
          "bookmarks": [
            "example"
          ],
          "lastLesson": "example",
          "revision": 1,
          "preferences": {
            "key": "value"
          }
        }
      },
      "ProgressResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "example": "123e4567-e89b-12d3-a456-426614174000"
          },
          "learnerId": {
            "type": "string",
            "example": "org_123"
          },
          "completed": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "exercises": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "bookmarks": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": [
              "example"
            ]
          },
          "lastLesson": {
            "type": "string",
            "maxLength": 100,
            "example": "example"
          },
          "revision": {
            "type": "integer",
            "example": 1
          },
          "preferences": {
            "type": "object",
            "additionalProperties": true,
            "example": {
              "key": "value"
            }
          },
          "createdAt": {
            "type": "string",
            "format": "date-time",
            "example": "2026-01-15T10:30:00Z"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time",
            "example": "2026-01-15T10:30:00Z"
          }
        },
        "required": [
          "id",
          "learnerId",
          "completed",
          "exercises",
          "bookmarks",
          "lastLesson",
          "revision",
          "preferences",
          "createdAt",
          "updatedAt"
        ],
        "example": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "learnerId": "org_123",
          "completed": [
            "example"
          ],
          "exercises": [
            "example"
          ],
          "bookmarks": [
            "example"
          ],
          "lastLesson": "example",
          "revision": 1,
          "preferences": {
            "key": "value"
          },
          "createdAt": "2026-01-15T10:30:00Z",
          "updatedAt": "2026-01-15T10:30:00Z"
        }
      },
      "ProgressList": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/ProgressResponse"
        },
        "example": [
          {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "learnerId": "org_123",
            "completed": [
              "example"
            ],
            "exercises": [
              "example"
            ],
            "bookmarks": [
              "example"
            ],
            "lastLesson": "example",
            "revision": 1,
            "preferences": {
              "key": "value"
            },
            "createdAt": "2026-01-15T10:30:00Z",
            "updatedAt": "2026-01-15T10:30:00Z"
          }
        ]
      }
    }
  }
};
