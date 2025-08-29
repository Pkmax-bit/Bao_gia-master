// File: frontend/src/App.jsx

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Container, Typography, Grid, Select, MenuItem, FormControl,
  InputLabel, TextField, Button, Box, Card, CardContent, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, Fab
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import { Slide, Divider } from "@mui/material";
import { LoadingButton } from "@mui/lab";
// Cấu hình API client, lấy URL của backend từ file .env
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
});

// Tạo một theme tùy chỉnh cho MUI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
});

// Component cho phần lựa chọn tùy chỉnh
// Component cho phần lựa chọn tùy chỉnh
function OptionsSelector({ options, selections, onChange }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth size="medium">
          <InputLabel>Loại Nhôm</InputLabel>
          <Select
            name="aluminum_id"
            value={selections.aluminum_id}
            label="Loại Nhôm"
            onChange={onChange}
          >
            {options.aluminums.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth size="medium">
          <InputLabel>Loại Tay Nắm</InputLabel>
          <Select
            name="handle_id"
            value={selections.handle_id}
            label="Loại Tay Nắm"
            onChange={onChange}
          >
            {options.handles.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth size="medium">
          <InputLabel>Loại Kính</InputLabel>
          <Select
            name="glass_id"
            value={selections.glass_id}
            label="Loại Kính"
            onChange={onChange}
          >
            {options.glasses.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth size="medium">
          <InputLabel>Bộ Phận</InputLabel>
          <Select
            name="part_id"
            value={selections.part_id}
            label="Bộ Phận"
            onChange={onChange}
          >
            {options.parts.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}


// Component cho phần thông tin khách hàng
function CustomerInfoForm({ customerInfo, onChange }) {
  return (
    <Grid container spacing={1} sx={{ mb: 1 }}>
      <Grid item xs={12}>
        <TextField fullWidth label="Họ và Tên" name="name" value={customerInfo.name} onChange={onChange} size="small" />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Số Điện Thoại" name="phone" value={customerInfo.phone} onChange={onChange} size="small" />
      </Grid>
    </Grid>
  );
}

// Component cho phần hiển thị chi tiết sản phẩm và điều chỉnh kích thước
function ProductDetailsSection({ productDetails, loading, error, adjustedDims, onDimChange, quantity, onQuantityChange, finalPrice, totalPrice, formatCurrency }) {
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}><CircularProgress size={24} /></Box>;
  }

  if (error) {
    return <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>{error}</Alert>;
  }

  if (!productDetails) {
    return null;
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold">Kích thước tiêu chuẩn (mm):</Typography>
      <Typography variant="body2" gutterBottom>{`Ngang ${productDetails.standard_width} x Cao ${productDetails.standard_height} x Sâu ${productDetails.standard_depth}`}</Typography>

      <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Giá niêm yết:</Typography>
      <Typography variant="body1" color="primary" gutterBottom>{formatCurrency(productDetails.price)} / {productDetails.unit}</Typography>

      <Grid container spacing={1} sx={{ my: 1 }}>
        <Grid item xs={6}>
          <TextField fullWidth label="Cao (mm)" name="height" type="number" value={adjustedDims.height} onChange={onDimChange} size="small" />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Sâu (mm)" name="depth" type="number" value={adjustedDims.depth} onChange={onDimChange} size="small" />
        </Grid>
      </Grid>

      <TextField fullWidth label="Số lượng" type="number" value={quantity} onChange={onQuantityChange} InputProps={{ inputProps: { min: 1 } }} size="small" sx={{ mb: 1 }} />

      <Typography variant="subtitle2" fontWeight="bold">Giá thực tế / sản phẩm:</Typography>
      <Typography variant="body1" color="secondary" gutterBottom>{formatCurrency(finalPrice)}</Typography>

      <Typography variant="subtitle2" fontWeight="bold">Thành tiền:</Typography>
      <Typography variant="h6" color="green" gutterBottom>{formatCurrency(totalPrice)}</Typography>
    </Box>
  );
}

function App() {
  // State để quản lý dialog popup
  const [open, setOpen] = useState(false);

  // State để lưu trữ các tùy chọn lấy từ API
  const [options, setOptions] = useState({ aluminums: [], handles: [], glasses: [], parts: [] });
  // State cho các lựa chọn của người dùng
  const [selections, setSelections] = useState({ aluminum_id: '', handle_id: '', glass_id: '', part_id: '' });

  // State cho thông tin chi tiết sản phẩm
  const [productDetails, setProductDetails] = useState(null);
  // State cho thông tin khách hàng
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  // State cho kích thước điều chỉnh
  const [adjustedDims, setAdjustedDims] = useState({ height: '', depth: '' });
  // State cho số lượng
  const [quantity, setQuantity] = useState(1);

  // State quản lý trạng thái UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Lấy các tùy chọn từ backend khi component được tải lần đầu
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await apiClient.get('/api/options');
        setOptions(response.data);
      } catch (err) {
        setError('Không thể tải dữ liệu tùy chọn từ server.');
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  // Lấy chi tiết sản phẩm mỗi khi người dùng thay đổi 1 trong 4 lựa chọn
  useEffect(() => {
    // Chỉ gọi API khi cả 4 trường đã được chọn
    if (Object.values(selections).every(val => val)) {
      const fetchProductDetails = async () => {
        setLoading(true);
        setError('');
        setProductDetails(null);
        try {
          const response = await apiClient.post('/api/product-details', selections);
          setProductDetails(response.data);
          // Cập nhật kích thước điều chỉnh bằng kích thước tiêu chuẩn
          setAdjustedDims({
            height: response.data.standard_height,
            depth: response.data.standard_depth
          });
        } catch (err) {
          setError('Không tìm thấy tổ hợp sản phẩm này. Vui lòng chọn lại.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProductDetails();
    }
  }, [selections]);

  // Hàm xử lý khi người dùng thay đổi lựa chọn
  const handleSelectionChange = (e) => {
    const { name, value } = e.target;
    setSelections(prev => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý khi người dùng thay đổi thông tin cá nhân
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý khi người dùng thay đổi kích thước
  const handleDimChange = (e) => {
    const { name, value } = e.target;
    setAdjustedDims(prev => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý khi thay đổi số lượng
  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  // Tính toán giá thực tế và thành tiền sử dụng useMemo để tối ưu hiệu suất
  const { finalPrice, totalPrice } = useMemo(() => {
    if (!productDetails) return { finalPrice: 0, totalPrice: 0 };

    const { price, standard_width, standard_height, standard_depth, material_percentage } = productDetails;

    const stdNgang = parseFloat(standard_width);
    const stdCao = parseFloat(standard_height);
    const stdSau = parseFloat(standard_depth);

    const adjCao = parseFloat(adjustedDims.height) || stdCao;
    const adjSau = parseFloat(adjustedDims.depth) || stdSau;

    const dienTichTieuChuan = 2 * (stdNgang * stdCao + stdNgang * stdSau + stdCao * stdSau);
    const dienTichDieuChinh = 2 * (stdNgang * adjCao + stdNgang * adjSau + adjCao * adjSau);

    // Sửa lại công thức tỉ lệ độ lệch
    const tiLeDoLech = dienTichTieuChuan > 0 ? dienTichDieuChinh / dienTichTieuChuan : 1;

    const phanTramNguyenVatLieu = parseFloat(material_percentage) / 100;

    const calculatedFinalPrice = price * ((phanTramNguyenVatLieu * tiLeDoLech) + (1 - phanTramNguyenVatLieu));
    const calculatedTotalPrice = calculatedFinalPrice * (parseInt(quantity) || 1);

    return { finalPrice: calculatedFinalPrice, totalPrice: calculatedTotalPrice };
  }, [productDetails, adjustedDims, quantity]);

  // Hàm xử lý khi gửi yêu cầu báo giá
  const handleSubmit = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      setSubmitStatus({ type: 'error', message: 'Vui lòng nhập đầy đủ Họ Tên và Số Điện Thoại.' });
      return;
    }

    // Lấy tên từng loại từ options
    const getNameById = (arr, id) => {
      const found = arr.find(item => item.id === id);
      return found ? found.name : '';
    };

    const quoteData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      productId: productDetails.product_id,
      actualWidth: productDetails.standard_width,
      actualHeight: parseFloat(adjustedDims.height),
      actualDepth: parseFloat(adjustedDims.depth),
      quantity: parseInt(quantity),
      totalPrice: totalPrice,
      aluminum_id: selections.aluminum_id,
      aluminum_name: getNameById(options.aluminums, selections.aluminum_id),
      handle_id: selections.handle_id,
      handle_name: getNameById(options.handles, selections.handle_id),
      glass_id: selections.glass_id,
      glass_name: getNameById(options.glasses, selections.glass_id),
      part_id: selections.part_id,
      part_name: getNameById(options.parts, selections.part_id)
    };

    try {
      setLoading(true);
      await apiClient.post('/api/quotes', quoteData);
      setSubmitStatus({ type: 'success', message: 'Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ sớm nhất.' });
      // Reset form
      setCustomerInfo({ name: '', phone: '' });
      setSelections({ aluminum_id: '', handle_id: '', glass_id: '', part_id: '' });
      setProductDetails(null);
    } catch (err) {
      setSubmitStatus({ type: 'error', message: 'Gửi yêu cầu thất bại. Vui lòng thử lại.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <ThemeProvider theme={theme}>
      {/* Nút floating để mở popup như bot chat */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <ChatIcon />
      </Fab>

      {/* Popup dialog giống như cửa sổ chat bot, điều chỉnh kích thước và vị trí để giống hình */}
      <Dialog
  open={open}
  onClose={() => setOpen(false)}
  fullWidth
  maxWidth={false}
  TransitionComponent={Slide}
  TransitionProps={{ direction: "up" }}
  sx={{
    "& .MuiDialog-paper": {
      position: "fixed",
      right: 16,
      bottom: 80,
      margin: 0,
      width: "380px",
      maxHeight: "calc(100vh - 100px)",
      borderRadius: 3,
      boxShadow: 6,
      overflowY: "auto",
    },
  }}
>
  <DialogTitle
    sx={{
      textAlign: "center",
      py: 1,
      bgcolor: "primary.main",
      color: "white",
      fontWeight: 700,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    }}
  >
    Báo Giá Tủ Nhôm Tự Động
  </DialogTitle>

  <DialogContent sx={{ px: 2, py: 2 }}>
    <Grid container spacing={2} direction="column">
      {/* Phần thông tin khách hàng */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontSize="1rem">
              1. Thông tin khách hàng
            </Typography>
            <CustomerInfoForm
              customerInfo={customerInfo}
              onChange={handleCustomerInfoChange}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Phần lựa chọn sản phẩm */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontSize="1rem">
              2. Tùy chọn sản phẩm
            </Typography>
            <OptionsSelector
              options={options}
              selections={selections}
              onChange={handleSelectionChange}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Phần kích thước và giá */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontSize="1rem">
              3. Kích thước & Giá
            </Typography>
            <ProductDetailsSection
              productDetails={productDetails}
              loading={loading}
              error={error}
              adjustedDims={adjustedDims}
              onDimChange={handleDimChange}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              finalPrice={finalPrice}
              totalPrice={totalPrice}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Nút gửi và thông báo */}
    <Box sx={{ textAlign: "center", mt: 3 }}>
      <LoadingButton
        variant="contained"
        size="medium"
        onClick={handleSubmit}
        loading={loading}
        disabled={!productDetails}
      >
        Yêu Cầu Tư Vấn
      </LoadingButton>
      {submitStatus.message && (
        <Alert
          severity={submitStatus.type}
          sx={{ mt: 2, py: 1, justifyContent: "center" }}
        >
          {submitStatus.message}
        </Alert>
      )}
    </Box>
  </DialogContent>
</Dialog>

    </ThemeProvider>
  );
}

export default App;