import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-warning/20 text-warning">
          <ShieldAlert size={48} />
        </div>
      </div>
      <h1 className="text-2xl font-bold">Acceso no autorizado</h1>
      <p className="opacity-80">
        No tienes permisos suficientes para acceder a esta página.
      </p>
      <div>
        <Link to="/" className="btn btn-primary">Volver al menú</Link>
      </div>
    </div>
  );
}
