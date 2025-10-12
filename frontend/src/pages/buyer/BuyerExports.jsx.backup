import { useEffect, useState } from 'react';
import { geoJsonService, authService } from '../../services/api';
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
        console.error('Error fetching exports:', err);
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
      console.error('Generate error:', err);
      setError('Failed to generate export: ' + (err.response?.data?.message || err.message));
    }
    setGenerating(false);
  };

  // ✅ FIXED: Proper download with auth token
  const handleDownload = async (id, fileName) => {
    try {
      // Get the blob data from the API
      const blob = await geoJsonService.downloadExport(id);

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `export_${id}.geojson`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Download started for:', fileName);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download export: ' + (err.response?.data?.message || err.message));
    }
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
          <Form.Select
            multiple
            value={filters.status}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFilters(f => ({ ...f, status: options }));
            }}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ready">Ready</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
          </Form.Select>
          <Form.Text className="text-muted">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple statuses.
          </Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" loading={generating}>
            {generating ? 'Generating...' : 'Generate Export'}
          </Button>
          <Button type="button" variant="outline-primary" onClick={() => setShowMap(true)}>
            <i className="bi bi-geo-alt me-1"></i> Show me on map
          </Button>
        </div>

        {error && <div className="alert alert-danger mt-2">{error}</div>}
      </Form>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading exports...</span>
          </div>
        </div>
      ) : exports.length === 0 ? (
        <div className="alert alert-info">
          No exports found. Click "Generate Export" to create one.
        </div>
      ) : (
        <Table hover responsive className="align-middle">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Created</th>
              <th>Features</th>
              <th>Downloads</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exports.map(exp => (
              <tr key={exp.id}>
                <td>
                  <code className="text-primary">{exp.fileName}</code>
                </td>
                <td>
                  <Badge bg={exp.status === 'ready' ? 'success' : 'warning'}>
                    {exp.status}
                  </Badge>
                </td>
                <td>
                  <small className="text-muted">{exp.exportType}</small>
                </td>
                <td>
                  {new Date(exp.createdAt).toLocaleString()}
                </td>
                <td>
                  <Badge bg="info">{exp.featureCount || 0} points</Badge>
                </td>
                <td>
                  {exp.downloadCount || 0}
                </td>
                <td>
                  {exp.status === 'ready' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDownload(exp.id, exp.fileName)}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </Button>
                  ) : (
                    <span className="text-muted">Not ready</span>
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