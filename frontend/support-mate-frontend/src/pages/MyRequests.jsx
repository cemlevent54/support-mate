import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import ChatIcon from '@mui/icons-material/Chat';

// Örnek talepler
const sampleRequests = [
  {
    id: 1,
    title: "Bilgisayar açılmıyor",
    description: "Bilgisayarım sabah açılmadı, ekranda hiçbir şey yok.",
    category: "hardware",
    status: "Açık",
    createdAt: "2024-06-01 09:30",
    files: [],
  },
  {
    id: 2,
    title: "VPN bağlantı sorunu",
    description: "Evden VPN'e bağlanamıyorum.",
    category: "network",
    status: "Kapalı",
    createdAt: "2024-05-28 14:10",
    files: [],
  },
];

const categoryLabels = {
  hardware: "Donanım",
  software: "Yazılım",
  network: "Ağ",
  other: "Diğer"
};

const MyRequests = () => {
  const [rows] = useState(sampleRequests);
  const navigate = useNavigate();

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'title', headerName: 'Başlık', width: 200 },
    { field: 'category', headerName: 'Kategori', width: 120, valueGetter: (params) => {
      const cat = params.row?.category;
      return cat ? (categoryLabels[cat] || cat) : '';
    } },
    { field: 'status', headerName: 'Durum', width: 100 },
    { field: 'createdAt', headerName: 'Oluşturulma', width: 150 },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<ChatIcon />}
          onClick={() => handleOpenChat(params.row)}
        >
          Chat
        </Button>
      ),
    },
  ];

  const handleOpenChat = (ticket) => {
    // Chat ekranına yönlendir, ticket verisini state ile taşı
    navigate('/my-requests/chat', { state: { ticket } });
  };

  return (
    <Box maxWidth={900} mx="auto" mt={6} p={3} bgcolor="#fff" borderRadius={2} boxShadow={2}>
      <Typography variant="h5" fontWeight={700} mb={3}>Taleplerim</Typography>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          disableSelectionOnClick
        />
      </div>
    </Box>
  );
};

export default MyRequests; 