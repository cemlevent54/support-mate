import React, { useEffect, useState } from "react";
import {
  getProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
} from "../../api/productApi";
import { getCategories } from "../../api/categoryApi";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuItem from '@mui/material/MenuItem';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useTranslation } from 'react-i18next';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    product_name_tr: "",
    product_name_en: "",
    product_category_id: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("jwt");
  const { t } = useTranslation();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProductsAdmin(token);
      if (res.data && res.data.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      setSnackbar({ open: true, message: "Ürünler alınamadı", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Kategorileri çek
    getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    }).catch(() => setCategories([]));
    // eslint-disable-next-line
  }, []);

  const handleOpen = (product = null) => {
    setEditProduct(product);
    setForm(
      product
        ? {
            product_name_tr: product.product_name_tr,
            product_name_en: product.product_name_en,
            product_category_id:
              product.product_category?.product_category_id ||
              product.product_category_id ||
              "",
          }
        : { product_name_tr: "", product_name_en: "", product_category_id: "" }
    );
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditProduct(null);
    setForm({ product_name_tr: "", product_name_en: "", product_category_id: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editProduct) {
        res = await updateProductAdmin(editProduct.id, form, token);
        setSnackbar({ open: true, message: res.data?.message || "Ürün güncellendi", severity: res.data?.success ? "success" : "error" });
      } else {
        res = await createProductAdmin(form, token);
        setSnackbar({ open: true, message: res.data?.message || "Ürün eklendi", severity: res.data?.success ? "success" : "error" });
      }
      if (res.data?.success) {
        fetchProducts();
        handleClose();
      }
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || "İşlem başarısız", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteProductAdmin(deleteId, token);
      setSnackbar({ open: true, message: res.data?.message || "Ürün silindi", severity: res.data?.success ? "success" : "error" });
      if (res.data?.success) fetchProducts();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || "Silme başarısız", severity: "error" });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  // Kategori adını getiren fonksiyon
  const getCategoryName = (product) => {
    if (product.product_category) {
      const lang = localStorage.getItem("language") || "tr";
      return lang === "tr" 
        ? product.product_category.product_category_name_tr 
        : product.product_category.product_category_name_en;
    }
    return "";
  };

  // Dil seçimini al
  const lang = localStorage.getItem("language") || "tr";

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>{t('adminProducts.title')}</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          {t('adminProducts.add')}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('adminProducts.table.nameTr')}</TableCell>
              <TableCell>{t('adminProducts.table.nameEn')}</TableCell>
              <TableCell>{t('adminProducts.table.category')}</TableCell>
              <TableCell>{t('adminProducts.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.product_name_tr}</TableCell>
                <TableCell>{product.product_name_en}</TableCell>
                <TableCell>
                  {getCategoryName(product)}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editProduct ? t('adminProducts.edit') : t('adminProducts.add')}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label={t('adminProducts.table.nameTr')}
              name="product_name_tr"
              value={form.product_name_tr}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              label={t('adminProducts.table.nameEn')}
              name="product_name_en"
              value={form.product_name_en}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              label={t('adminProducts.table.category')}
              name="product_category_id"
              value={form.product_category_id}
              onChange={handleChange}
              fullWidth
              required
              select
            >
              <MenuItem value="">{t('adminProducts.selectCategory')}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.category_name_tr || cat.category_name_en || cat.name || cat.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t('adminProducts.cancel')}</Button>
            <Button type="submit" variant="contained" color="primary">
              {editProduct ? t('adminProducts.edit') : t('adminProducts.add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmModal
        open={confirmOpen}
        title={t('adminProducts.confirmDeleteTitle')}
        description={t('adminProducts.confirmDeleteDesc')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmColor="error"
        cancelColor="inherit"
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminProducts;
