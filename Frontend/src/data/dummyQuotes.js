// Quote Statuses:
// PENDING - Customer submitted, waiting for admin pricing
// PRICED - Admin has provided pricing, waiting for customer action
// REVISION_REQUESTED - Customer requested revision with notes
// CONVERTED - Customer accepted and converted to order
// REJECTED - Customer rejected the quote

export const dummyQuotes = [
  {
    id: 201,
    user_id: 1,
    quote_no: "QT-20250110-0001",
    quote_type: "VECTOR",
    status: "PRICED",
    design_name: "Lion Badge",
    height: 5,
    width: 5,
    unit: "inch",
    number_of_colors: null,
    fabric: null,
    color_type: "Full Color",
    placement: ["Back"],
    required_format: ["AI", "SVG"],
    instruction: "Vector clean paths only.",
    is_urgent: 0,
    // Current pricing
    current_price: 25.00,
    currency: "USD",
    // Pricing history (newest first)
    pricing_history: [
      {
        id: 1,
        price: 25.00,
        currency: "USD",
        admin_notes: "Includes 2 revisions. Standard vector pricing applied.",
        created_at: "2025-01-10T15:30:00Z",
        created_by: "admin"
      }
    ],
    // Remarks history (conversation between admin and customer)
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote has been priced. This includes 2 free revisions. Please review and confirm.",
        created_at: "2025-01-10T15:30:00Z",
        created_by: "Admin"
      }
    ],
    converted_order_id: null,
    created_at: "2025-01-10T15:00:00Z",
    updated_at: "2025-01-10T15:30:00Z"
  },
  {
    id: 202,
    user_id: 1,
    quote_no: "QT-20250110-0002",
    quote_type: "DIGITIZING",
    status: "REVISION_REQUESTED",
    design_name: "Custom Logo",
    height: 4.5,
    width: 3.5,
    unit: "inch",
    number_of_colors: 6,
    fabric: "Cotton",
    color_type: null,
    placement: ["Front"],
    required_format: ["DST", "EMB"],
    instruction: "High quality digitizing required.",
    is_urgent: 1,
    current_price: 45.00,
    currency: "USD",
    pricing_history: [
      {
        id: 2,
        price: 45.00,
        currency: "USD",
        admin_notes: "Urgent order premium applied (+20%). High detail digitizing.",
        created_at: "2025-01-10T17:00:00Z",
        created_by: "admin"
      }
    ],
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote has been priced at $45 including urgent delivery fee.",
        created_at: "2025-01-10T17:00:00Z",
        created_by: "Admin"
      },
      {
        id: 2,
        type: "customer",
        message: "The price seems high. Can we discuss a discount for bulk orders? I plan to place 5 more orders this month.",
        created_at: "2025-01-10T18:00:00Z",
        created_by: "John Doe"
      }
    ],
    converted_order_id: null,
    created_at: "2025-01-10T16:00:00Z",
    updated_at: "2025-01-10T18:00:00Z"
  },
  {
    id: 203,
    user_id: 1,
    quote_no: "QT-20250109-0003",
    quote_type: "PATCHES",
    status: "PRICED",
    design_name: "Emblem Design",
    height: 3.5,
    width: 3.5,
    unit: "inch",
    number_of_colors: 4,
    fabric: "Polyester",
    color_type: null,
    placement: ["Left Chest"],
    required_format: ["EMB"],
    instruction: "Military style patch.",
    is_urgent: 0,
    current_price: 40.00,
    currency: "USD",
    pricing_history: [
      {
        id: 1,
        price: 50.00,
        currency: "USD",
        admin_notes: "Standard patch pricing",
        created_at: "2025-01-09T12:00:00Z",
        created_by: "admin"
      },
      {
        id: 2,
        price: 40.00,
        currency: "USD",
        admin_notes: "Revised price after customer feedback. 20% discount applied.",
        created_at: "2025-01-09T15:00:00Z",
        created_by: "admin"
      }
    ],
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote priced at $50. Standard patch pricing.",
        created_at: "2025-01-09T12:00:00Z",
        created_by: "Admin"
      },
      {
        id: 2,
        type: "customer",
        message: "Can you offer a better price? I'm a returning customer.",
        created_at: "2025-01-09T13:00:00Z",
        created_by: "John Doe"
      },
      {
        id: 3,
        type: "admin",
        message: "Thank you for being a loyal customer! We've applied a 20% discount. New price: $40",
        created_at: "2025-01-09T15:00:00Z",
        created_by: "Admin"
      }
    ],
    converted_order_id: null,
    created_at: "2025-01-09T11:00:00Z",
    updated_at: "2025-01-09T15:00:00Z"
  },
  {
    id: 204,
    user_id: 1,
    quote_no: "QT-20250109-0004",
    quote_type: "VECTOR",
    status: "CONVERTED",
    design_name: "Brand Identity",
    height: 6.0,
    width: 6.0,
    unit: "inch",
    number_of_colors: null,
    fabric: null,
    color_type: "Full Color",
    placement: ["Front", "Back"],
    required_format: ["AI", "PDF"],
    instruction: "Complete brand identity package.",
    is_urgent: 0,
    current_price: 150.00,
    currency: "USD",
    pricing_history: [
      {
        id: 1,
        price: 150.00,
        currency: "USD",
        admin_notes: "Package deal for complete brand identity",
        created_at: "2025-01-08T14:00:00Z",
        created_by: "admin"
      }
    ],
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote has been priced. This is a complete brand identity package deal.",
        created_at: "2025-01-08T14:00:00Z",
        created_by: "Admin"
      },
      {
        id: 2,
        type: "customer",
        message: "Looks good! Converting to order.",
        created_at: "2025-01-09T09:00:00Z",
        created_by: "John Doe"
      }
    ],
    converted_order_id: 105,
    created_at: "2025-01-08T10:00:00Z",
    updated_at: "2025-01-09T09:00:00Z"
  },
  {
    id: 205,
    user_id: 1,
    quote_no: "QT-20250108-0005",
    quote_type: "DIGITIZING",
    status: "PENDING",
    design_name: "Sports Team Logo",
    height: 5.5,
    width: 4.0,
    unit: "inch",
    number_of_colors: 8,
    fabric: "Cotton",
    color_type: null,
    placement: ["Front"],
    required_format: ["DST"],
    instruction: "Urgent quote needed.",
    is_urgent: 1,
    current_price: null,
    currency: null,
    pricing_history: [],
    remarks_history: [],
    converted_order_id: null,
    created_at: "2025-01-08T14:00:00Z",
    updated_at: "2025-01-08T14:00:00Z"
  },
  {
    id: 206,
    user_id: 1,
    quote_no: "QT-20250108-0006",
    quote_type: "VECTOR",
    status: "REJECTED",
    design_name: "Logo Redesign",
    height: 4.0,
    width: 4.0,
    unit: "inch",
    number_of_colors: null,
    fabric: null,
    color_type: "Gradient",
    placement: ["Front"],
    required_format: ["AI"],
    instruction: "Modern minimalist design.",
    is_urgent: 0,
    current_price: 35.00,
    currency: "USD",
    pricing_history: [
      {
        id: 1,
        price: 35.00,
        currency: "USD",
        admin_notes: "Standard pricing",
        created_at: "2025-01-08T10:00:00Z",
        created_by: "admin"
      }
    ],
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote has been priced at $35.",
        created_at: "2025-01-08T10:00:00Z",
        created_by: "Admin"
      },
      {
        id: 2,
        type: "customer",
        message: "Unfortunately, this is out of my budget. Rejecting the quote for now.",
        created_at: "2025-01-08T12:00:00Z",
        created_by: "John Doe"
      }
    ],
    converted_order_id: null,
    created_at: "2025-01-07T09:00:00Z",
    updated_at: "2025-01-08T12:00:00Z"
  },
  {
    id: 207,
    user_id: 1,
    quote_no: "QT-20250107-0007",
    quote_type: "PATCHES",
    status: "PENDING",
    design_name: "Custom Patch",
    height: 3.0,
    width: 3.0,
    unit: "inch",
    number_of_colors: 5,
    fabric: "Polyester",
    color_type: null,
    placement: ["Back"],
    required_format: ["EMB"],
    instruction: "Custom design patch.",
    is_urgent: 0,
    current_price: null,
    currency: null,
    pricing_history: [],
    remarks_history: [],
    converted_order_id: null,
    created_at: "2025-01-07T13:00:00Z",
    updated_at: "2025-01-07T13:00:00Z"
  },
  {
    id: 208,
    user_id: 1,
    quote_no: "QT-20250107-0008",
    quote_type: "DIGITIZING",
    status: "PRICED",
    design_name: "Monogram Design",
    height: 2.5,
    width: 2.5,
    unit: "inch",
    number_of_colors: 3,
    fabric: "Linen",
    color_type: null,
    placement: ["Left Chest"],
    required_format: ["DST", "EMB"],
    instruction: "Elegant monogram style.",
    is_urgent: 0,
    current_price: 20.00,
    currency: "USD",
    pricing_history: [
      {
        id: 1,
        price: 20.00,
        currency: "USD",
        admin_notes: "Simple design pricing",
        created_at: "2025-01-07T11:00:00Z",
        created_by: "admin"
      }
    ],
    remarks_history: [
      {
        id: 1,
        type: "admin",
        message: "Quote priced. Simple design with standard pricing.",
        created_at: "2025-01-07T11:00:00Z",
        created_by: "Admin"
      }
    ],
    converted_order_id: null,
    created_at: "2025-01-06T10:00:00Z",
    updated_at: "2025-01-07T11:00:00Z"
  }
];
