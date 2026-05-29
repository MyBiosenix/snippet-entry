import React from "react";

function PaginationControls({ pagination, onPageChange }) {
  if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  return (
    <div className="pagination-container">
      <div className="pagination">
        <button onClick={() => onPageChange(page - 1)} disabled={!hasPrevPage}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => onPageChange(page + 1)} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
