type Primitive = string | number | boolean | null | undefined | Record<string, unknown>;

type AdminDataTableProps<T extends Record<string, Primitive>> = {
  title: string;
  rows: T[];
};

export function AdminDataTable<T extends Record<string, Primitive>>({ title, rows }: AdminDataTableProps<T>) {
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{rows.length} rows</p>
      </div>
      {rows.length === 0 ? (
        <p>データがありません。</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    const value = row[column];

                    return (
                      <td key={`${index}-${column}`}>
                        {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
