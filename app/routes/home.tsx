import { Link } from "react-router";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-black pb-3">Добро пожаловать</h1>
        <Link
          to="/items"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-lg"
        >
          Перейти к списку элементов
        </Link>
      </div>
    </div>
  );
}
