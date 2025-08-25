import { useEffect, useState } from 'react';
import { geoJsonService } from '../../services/api';
import Button from '../../components/common/Button';
import { Container, Table, Badge, Modal, Form } from 'react-bootstrap';
import BookSuppliersMap from '../../components/common/BookSuppliersMap';

export default function BuyerExports() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: ['pending', 'confirmed', 'completed'] });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    async function fetchExports() {
      setLoading(true);
      try {
        const res = await geoJsonService.getMyExports();
        setExports(res.exports || []);
      } catch (err) {
        setExports([]);
      }
      setLoading(false);
    }
    fetchExports();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      await geoJsonService.generateExport({
        exportType: 'buyer_orders',
        filters
      });
      // Refresh exports list
      const res = await geoJsonService.getMyExports();
      setExports(res.exports || []);
    } catch (err) {
      setError('Failed to generate export.');
    }
    setGenerating(false);
  };

  const handleDownload = async (id) => {
    window.open(`/api/geojson/download/${id}`, '_blank');
  };

  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-download me-2"></i>
        GeoJSON Exports
      </h1>
      <p className="text-muted">Generate and download GeoJSON files for your Flutter mobile app.</p>
      <Form onSubmit={handleGenerate} className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Status</Form.Label>
          <Form.Select multiple value={filters.status} onChange={e => {
            const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
            setFilters(f => ({ ...f, status: options }));
          }}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </Form.Select>
          <Form.Text className="text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple statuses.</Form.Text>
        </Form.Group>
        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" loading={generating}>Generate Export</Button>
          <Button type="button" variant="outline-primary" onClick={() => setShowMap(true)}>
            <i className="bi bi-geo-alt me-1"></i> Show me on map
          </Button>
        </div>
        {error && <div className="alert alert-danger mt-2">{error}</div>}
      </Form>
      {loading ? (
        <div className="text-center py-5">Loading exports...</div>
      ) : exports.length === 0 ? (
        <div className="alert alert-info">No exports found.</div>
      ) : (
        <Table hover responsive className="align-middle">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Created</th>
              <th>Features</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exports.map(exp => (
              <tr key={exp.id}>
                <td>{exp.fileName}</td>
                <td><Badge bg={exp.status === 'ready' ? 'success' : 'warning'}>{exp.status}</Badge></td>
                <td>{exp.exportType}</td>
                <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                <td>{exp.featureCount || '-'}</td>
                <td>
                  {exp.status === 'ready' && (
                    <Button size="sm" variant="primary" onClick={() => handleDownload(exp.id)}>Download</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <BookSuppliersMap
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        bookTitle={null}
        bookAuthor={null}
        statusFilters={filters.status}
      />
    </Container>
  );
}
