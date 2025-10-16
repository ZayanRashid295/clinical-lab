export let schema = [
  {
    filename: "auth.prisma",

    tables: [
      {
        name: "User",

        fields: [
          { fieldname: "id", type: "string" },
          { fieldname: "email", type: "string" },
          { fieldname: "passwordHash", type: "string" },
          { fieldname: "name", type: "string" },
          { fieldname: "createdAt", type: "datetime" },
        ],

        relationWith: [
          { with: "UserRole", type: "one-to-many" },
          { with: "Order", type: "one-to-many" },
        ],
      },

      {
        name: "Role",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "name", type: "string" },

          { fieldname: "description", type: "string" },
        ],

        relationWith: [
          { with: "UserRole", type: "one-to-many" },

          { with: "RolePermission", type: "one-to-many" },
        ],
      },

      {
        name: "Permission",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "name", type: "string" },

          { fieldname: "description", type: "string" },
        ],

        relationWith: [{ with: "RolePermission", type: "one-to-many" }],
      },

      {
        name: "UserRole",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "userId", type: "string" },

          { fieldname: "roleId", type: "string" },
        ],

        relationWith: [
          { with: "User", type: "many-to-one" },

          { with: "Role", type: "many-to-one" },
        ],
      },

      {
        name: "RolePermission",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "roleId", type: "string" },

          { fieldname: "permissionId", type: "string" },
        ],

        relationWith: [
          { with: "Role", type: "many-to-one" },

          { with: "Permission", type: "many-to-one" },
        ],
      },
    ],

    description:
      "Authentication and authorization models: User, Role, Permission and their many-to-many relations.",
  },

  {
    filename: "catalog.prisma",

    tables: [
      {
        name: "Product",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "name", type: "string" },

          { fieldname: "description", type: "string" },

          { fieldname: "price", type: "float" },

          { fieldname: "createdAt", type: "datetime" },
        ],

        relationWith: [
          { with: "ProductCategory", type: "one-to-many" },

          { with: "ProductImage", type: "one-to-many" },

          { with: "OrderItem", type: "one-to-many" },
        ],
      },

      {
        name: "Category",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "name", type: "string" },

          { fieldname: "description", type: "string" },
        ],

        relationWith: [{ with: "ProductCategory", type: "one-to-many" }],
      },

      {
        name: "ProductCategory",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "productId", type: "string" },

          { fieldname: "categoryId", type: "string" },
        ],

        relationWith: [
          { with: "Product", type: "many-to-one" },

          { with: "Category", type: "many-to-one" },
        ],
      },

      {
        name: "ProductImage",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "productId", type: "string" },

          { fieldname: "url", type: "string" },

          { fieldname: "altText", type: "string" },
        ],

        relationWith: [{ with: "Product", type: "many-to-one" }],
      },
    ],

    description:
      "Product catalog models including products, categories, product-category many-to-many relation, and product images.",
  },

  {
    filename: "orders.prisma",

    tables: [
      {
        name: "Order",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "userId", type: "string" },

          { fieldname: "status", type: "string" },

          { fieldname: "totalPrice", type: "float" },

          { fieldname: "createdAt", type: "datetime" },
        ],

        relationWith: [
          { with: "User", type: "many-to-one" },

          { with: "OrderItem", type: "one-to-many" },

          { with: "Payment", type: "one-to-many" },

          { with: "Shipment", type: "one-to-many" },
        ],
      },

      {
        name: "OrderItem",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "orderId", type: "string" },

          { fieldname: "productId", type: "string" },

          { fieldname: "quantity", type: "integer" },

          { fieldname: "price", type: "float" },
        ],

        relationWith: [
          { with: "Order", type: "many-to-one" },

          { with: "Product", type: "many-to-one" },
        ],
      },

      {
        name: "Payment",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "orderId", type: "string" },

          { fieldname: "paymentMethod", type: "string" },

          { fieldname: "amount", type: "float" },

          { fieldname: "paidAt", type: "datetime" },
        ],

        relationWith: [{ with: "Order", type: "many-to-one" }],
      },

      {
        name: "Shipment",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "orderId", type: "string" },

          { fieldname: "trackingNumber", type: "string" },

          { fieldname: "carrier", type: "string" },

          { fieldname: "shippedAt", type: "datetime" },

          { fieldname: "deliveredAt", type: "datetime" },
        ],

        relationWith: [{ with: "Order", type: "many-to-one" }],
      },
    ],

    description:
      "Order management models: Order, OrderItem, Payment, and Shipment with relevant relations.",
  },

  {
    filename: "reviews.prisma",

    tables: [
      {
        name: "Review",

        fields: [
          { fieldname: "id", type: "string" },

          { fieldname: "productId", type: "string" },

          { fieldname: "userId", type: "string" },

          { fieldname: "rating", type: "integer" },

          { fieldname: "comment", type: "string" },

          { fieldname: "createdAt", type: "datetime" },
        ],

        relationWith: [
          { with: "Product", type: "many-to-one" },

          { with: "User", type: "many-to-one" },
        ],
      },
    ],

    description:
      "Customer review model linking users and products with ratings and comments.",
  },
];
