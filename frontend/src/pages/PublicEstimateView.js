import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmt = (num) =>
  Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PublicEstimateView() {
  const { token } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await axios.get(`${API}/estimates/public/${token}`);
        setEstimate(res.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [token]);

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('estimate-pdf-content');
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Estimate-${estimate.estimate_number}.pdf`);
    } catch {
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading estimate...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Estimate Not Found</h1>
          <p className="text-gray-500">This link may be invalid or the estimate has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Download button */}
        <div className="flex justify-end mb-4 px-4">
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Estimate content */}
        <div id="estimate-pdf-content" className="bg-white px-12 py-8">
          {/* Header Section */}
          <div className="relative mb-4 flex justify-between items-start">
            <div>
              <img
                src="/estimate-header.jpg"
                alt="Estimate Header"
                className="h-auto"
                style={{ maxWidth: '600px' }}
              />
            </div>
            <div className="border-2 border-green-600 rounded-lg p-3 bg-white min-w-[180px]">
              <div className="mb-2">
                <p className="text-xs font-semibold">Date:</p>
                <p className="text-sm">{estimate.estimate_date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold">Quotation No:</p>
                <p className="text-sm">{estimate.estimate_number}</p>
              </div>
            </div>
          </div>

          {/* Quotation Title */}
          <div className="mb-4 mt-2">
            <h2 className="text-2xl font-bold">Quotation</h2>
          </div>

          {/* Customer Name and Subject */}
          <div className="mb-4">
            <p className="text-2xl font-bold mb-1">{estimate.customer?.name}</p>
            {estimate.subject && (
              <p className="text-base text-gray-800 mb-1">{estimate.subject}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table
              className="w-full border-2 border-black rounded-lg"
              style={{ borderCollapse: 'separate', borderSpacing: 0, borderRadius: '8px', overflow: 'hidden' }}
            >
              <thead>
                <tr className="bg-white">
                  <th className="border border-black text-left p-3 font-semibold">Item</th>
                  <th className="border border-black text-center p-3 font-semibold">Size</th>
                  <th className="border border-black text-center p-3 font-semibold">Qty.</th>
                  <th className="border border-black text-center p-3 font-semibold">Unit Price</th>
                  <th className="border border-black text-right p-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-3">
                      <div>
                        <p className="font-semibold mb-1">{item.product_name}</p>
                        {item.description && (
                          <p className="text-xs italic text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-black text-center p-3">{item.size || ''}</td>
                    <td className="border border-black text-center p-3">{item.quantity}</td>
                    <td className="border border-black text-center p-3">
                      {item.display_amounts !== false && estimate.display_total_amounts !== false
                        ? `Rs.${fmt(item.unit_price)}`
                        : ''}
                    </td>
                    <td className="border border-black text-right p-3">
                      {item.display_amounts !== false && estimate.display_total_amounts !== false
                        ? `Rs.${fmt(item.total)}`
                        : ''}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Row */}
                {estimate.discount > 0 && (
                  <tr className="bg-white">
                    <td colSpan="4" className="border border-black text-right p-3">Subtotal</td>
                    <td className="border border-black text-right p-3">
                      {estimate.display_total_amounts !== false ? `Rs.${fmt(estimate.subtotal)}` : ''}
                    </td>
                  </tr>
                )}
                {/* Discount Row */}
                {estimate.discount > 0 && estimate.display_total_amounts !== false && (
                  <tr className="bg-white">
                    <td colSpan="4" className="border border-black text-right p-3">
                      Discount{' '}
                      {estimate.discount_type === 'percentage' ? `(${estimate.discount}%)` : ''}
                    </td>
                    <td className="border border-black text-right p-3">
                      - Rs.
                      {fmt(
                        estimate.discount_type === 'percentage'
                          ? estimate.subtotal * (estimate.discount / 100)
                          : estimate.discount
                      )}
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-white">
                  <td colSpan="4" className="border border-black text-right p-3 font-bold">Total</td>
                  <td className="border border-black text-right p-3 font-bold">
                    {estimate.display_total_amounts !== false ? `Rs.${fmt(estimate.total)}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          {estimate.notes && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">{estimate.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mb-6 text-sm">
            <p className="mb-2">
              An advance of 70% (Seventy Percent) is requested at the time of placing of the order.
              This quotation is valid for 30 Days.
            </p>
            <p>
              The online payment to be made to "
              <strong>
                {estimate.bank_account === 'commercial'
                  ? 'Bank Name - Commercial Bank | Acc.Name - Ekma Digital Solutions (Private) Limited | Acc. Number- 1001073055'
                  : 'Bank Name - NDB Bank | Acc.Name - Ekma Digital Solutions Pvt Ltd | Acc. Number- 101000707296 | Branch - Boralesgamuwa'}
              </strong>
              "
            </p>
          </div>

          {/* Footer Section */}
          <div className="space-y-1">
            <p className="text-base">Thank you</p>
            <p className="text-base">Your truly,</p>
            <img
              src="/signature.png"
              alt="Signature"
              className="h-16 w-auto my-2"
            />
            <p className="text-base font-semibold">S. G. Jamitha</p>
            <p className="text-base">Ekma Digital Solutions (Private) Limited.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
