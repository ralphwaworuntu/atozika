import { Navigate, useParams } from 'react-router-dom';

/** Legacy detail route — redirects to the scoring page. */
export function CermatHistoryDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  if (!attemptId) {
    return <Navigate to="/app/tes-kecermatan/riwayat" replace />;
  }
  return <Navigate to={`/app/tes-kecermatan/hasil/${attemptId}`} replace />;
}
