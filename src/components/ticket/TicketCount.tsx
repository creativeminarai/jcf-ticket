export function TicketCount() {
  return (
    <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        チケット枚数
      </h2>
      <div className="flex items-center justify-center space-x-4 mb-6">
        {[1, 2].map((ticket) => (
          <div key={ticket} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🎫</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium"
        style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
      >
        追加チケット購入
      </button>
    </section>
  );
}
