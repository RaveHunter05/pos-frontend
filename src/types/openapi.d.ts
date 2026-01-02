/* eslint-disable */
export interface components {
  schemas: {
    ProductResponse: {
      id: number;
      name: string;
      sku: string;
      barcode?: string;
      description?: string;
      salePrice: number;
      stock: number;
      category?: string;
      branchId?: number;
    };
    CustomerResponse: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
      identification?: string;
    };
    PaymentMethodResponse: {
      id: number;
      name: string;
      type: string;
    };
    InvoiceItemRequest: {
      productId: number;
      quantity: number;
      unitPrice: number;
      discount?: number;
    };
    InvoiceRequest: {
      branchId: number;
      customerId?: number;
      paymentMethodId: number;
      items: components['schemas']['InvoiceItemRequest'][];
      discount?: number;
      notes?: string;
    };
    InvoiceResponse: {
      id: number;
      number: string;
      status: 'PAID' | 'PENDING' | 'CANCELLED';
      total: number;
      subtotal: number;
      tax: number;
      discount?: number;
      customer?: components['schemas']['CustomerResponse'];
      createdAt: string;
      items: Array<{
        product: components['schemas']['ProductResponse'];
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
    };
    SalesByDayResponse: Array<{
      date: string;
      total: number;
    }>;
    TopProductResponse: Array<{
      productId: number;
      name: string;
      total: number;
      quantity: number;
    }>;
    RevenueByCategoryResponse: Array<{
      category: string;
      total: number;
    }>;
    DashboardMetricsResponse: {
      salesToday: number;
      ticketsToday: number;
      averageTicket: number;
      newCustomers: number;
    };
  };
}

export interface paths {
  '/api/products': {
    get: {
      parameters: {
        query: {
          page?: number;
          size?: number;
          search?: string;
          branchId?: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              content: components['schemas']['ProductResponse'][];
              totalElements: number;
              totalPages: number;
              page: number;
            };
          };
        };
      };
    };
  };
  '/api/products/{id}': {
    get: {
      parameters: {
        path: {
          id: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ProductResponse'];
          };
        };
      };
    };
  };
  '/api/customers': {
    get: {
      parameters: {
        query: {
          page?: number;
          size?: number;
          search?: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              content: components['schemas']['CustomerResponse'][];
              totalElements: number;
              totalPages: number;
              page: number;
            };
          };
        };
      };
    };
  };
  '/api/customers/{id}': {
    get: {
      parameters: {
        path: {
          id: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['CustomerResponse'];
          };
        };
      };
    };
  };
  '/api/invoices': {
    get: {
      parameters: {
        query: {
          page?: number;
          size?: number;
          customerId?: number;
          branchId?: number;
          status?: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              content: components['schemas']['InvoiceResponse'][];
              totalElements: number;
              totalPages: number;
              page: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['InvoiceRequest'];
        };
      };
      responses: {
        201: {
          content: {
            'application/json': components['schemas']['InvoiceResponse'];
          };
        };
      };
    };
  };
  '/api/invoices/{id}': {
    get: {
      parameters: {
        path: {
          id: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['InvoiceResponse'];
          };
        };
      };
    };
  };
  '/api/payment-methods': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['PaymentMethodResponse'][];
          };
        };
      };
    };
  };
  '/api/reports/sales-by-day': {
    get: {
      parameters: {
        query: {
          from: string;
          to: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['SalesByDayResponse'];
          };
        };
      };
    };
  };
  '/api/reports/top-products': {
    get: {
      parameters: {
        query: {
          from: string;
          to: string;
          limit?: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['TopProductResponse'];
          };
        };
      };
    };
  };
  '/api/reports/revenue-by-category': {
    get: {
      parameters: {
        query: {
          from: string;
          to: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['RevenueByCategoryResponse'];
          };
        };
      };
    };
  };
  '/api/reports/dashboard': {
    get: {
      parameters: {
        query: {
          branchId?: number;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['DashboardMetricsResponse'];
          };
        };
      };
    };
  };
}
