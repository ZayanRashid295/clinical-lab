import React, { useState } from 'react';

// Sample data
const usersData = [
{ id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
{ id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
{ id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User" },
{ id: 4, name: "Alice Brown", email: "alice@example.com", role: "Manager" },
{ id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "User" },
{ id: 6, name: "Diana Davis", email: "diana@example.com", role: "Admin" },
{ id: 7, name: "Eve Martinez", email: "eve@example.com", role: "User" },
{ id: 8, name: "Frank Garcia", email: "frank@example.com", role: "Manager" },
{ id: 9, name: "Grace Lee", email: "grace@example.com", role: "User" },
{ id: 10, name: "Henry Taylor", email: "henry@example.com", role: "User" },
{ id: 11, name: "Ivy Anderson", email: "ivy@example.com", role: "Admin" },
{ id: 12, name: "Jack Thomas", email: "jack@example.com", role: "User" },
{ id: 13, name: "Kate White", email: "kate@example.com", role: "Manager" },
{ id: 14, name: "Leo Harris", email: "leo@example.com", role: "User" },
{ id: 15, name: "Mia Clark", email: "mia@example.com", role: "User" },
{ id: 16, name: "Noah Lewis", email: "noah@example.com", role: "Admin" },
{ id: 17, name: "Olivia Walker", email: "olivia@example.com", role: "User" },
{ id: 18, name: "Paul Hall", email: "paul@example.com", role: "Manager" },
{ id: 19, name: "Quinn Allen", email: "quinn@example.com", role: "User" },
{ id: 20, name: "Ruby Young", email: "ruby@example.com", role: "User" },
{ id: 21, name: "Sam King", email: "sam@example.com", role: "Admin" },
{ id: 22, name: "Tina Wright", email: "tina@example.com", role: "User" },
{ id: 23, name: "Uma Scott", email: "uma@example.com", role: "Manager" },
{ id: 24, name: "Victor Green", email: "victor@example.com", role: "User" },
{ id: 25, name: "Wendy Adams", email: "wendy@example.com", role: "User" }
];

const productsData = [
{ id: 1, product: "Laptop", category: "Electronics", price: "$999" },
{ id: 2, product: "Mouse", category: "Accessories", price: "$29" },
{ id: 3, product: "Keyboard", category: "Accessories", price: "$79" },
{ id: 4, product: "Monitor", category: "Electronics", price: "$299" },
{ id: 5, product: "Desk Chair", category: "Furniture", price: "$199" },
{ id: 6, product: "Headphones", category: "Accessories", price: "$149" },
{ id: 7, product: "Webcam", category: "Electronics", price: "$89" },
{ id: 8, product: "Desk Lamp", category: "Furniture", price: "$39" },
{ id: 9, product: "USB Cable", category: "Accessories", price: "$12" },
{ id: 10, product: "External SSD", category: "Storage", price: "$179" },
{ id: 11, product: "Smartphone", category: "Electronics", price: "$799" },
{ id: 12, product: "Tablet", category: "Electronics", price: "$499" },
{ id: 13, product: "Router", category: "Networking", price: "$129" },
{ id: 14, product: "Printer", category: "Electronics", price: "$249" },
{ id: 15, product: "Scanner", category: "Electronics", price: "$199" },
{ id: 16, product: "Bookshelf", category: "Furniture", price: "$89" },
{ id: 17, product: "Desk", category: "Furniture", price: "$299" },
{ id: 18, product: "Whiteboard", category: "Office", price: "$59" },
{ id: 19, product: "Filing Cabinet", category: "Furniture", price: "$149" },
{ id: 20, product: "Paper Shredder", category: "Office", price: "$79" },
{ id: 21, product: "Coffee Maker", category: "Appliances", price: "$99" },
{ id: 22, product: "Water Cooler", category: "Appliances", price: "$189" },
{ id: 23, product: "Microwave", category: "Appliances", price: "$129" },
{ id: 24, product: "Mini Fridge", category: "Appliances", price: "$199" },
{ id: 25, product: "Air Purifier", category: "Appliances", price: "$249" }
];

// Reusable PaginatedTable component
const PaginatedTable = ({ title, data, columns }) => {
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

const totalPages = Math.ceil(data.length / pageSize);
const startIndex = (currentPage - 1) \* pageSize;
const endIndex = startIndex + pageSize;
const currentData = data.slice(startIndex, endIndex);

const handlePrevious = () => {
if (currentPage > 1) {
setCurrentPage(currentPage - 1);
}
};

const handleNext = () => {
if (currentPage < totalPages) {
setCurrentPage(currentPage + 1);
}
};

const handlePageSizeChange = (e) => {
setPageSize(Number(e.target.value));
setCurrentPage(1);
};

return (
<div className="bg-white rounded-xl p-6 shadow-lg mb-8">
<h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-gray-600 text-sm">Rows per page:</label>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr
                key={row.id || index}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-gray-700">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Previous
        </button>
        <span className="text-gray-600 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Next
        </button>
      </div>
    </div>

);
};

// Main component
export default function TwoTablesWithPagination() {
const userColumns = [
{ key: 'id', label: 'ID' },
{ key: 'name', label: 'Name' },
{ key: 'email', label: 'Email' },
{ key: 'role', label: 'Role' }
];

const productColumns = [
{ key: 'id', label: 'ID' },
{ key: 'product', label: 'Product' },
{ key: 'category', label: 'Category' },
{ key: 'price', label: 'Price' }
];

return (
<div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-900 p-6">
<div className="max-w-6xl mx-auto">
<PaginatedTable
          title="Users Table"
          data={usersData}
          columns={userColumns}
        />
<PaginatedTable
          title="Products Table"
          data={productsData}
          columns={productColumns}
        />
</div>
</div>
);
}
