import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Avatar, IconButton, Menu, MenuItem, Switch, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { usePagination } from '../hooks/usePagination';
import CustomSnackbar from '../component/CustomSnackbar';
import { BASE_URL } from '../costants';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#d32f2f' },
        success: { main: '#2e7d32' },
    },
    typography: {
        fontFamily: 'Arial, sans-serif',
    },
    components: {
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    backgroundColor: '#f4f6f8',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#1976d2',
                        fontSize: '1.1rem',
                    },
                },
            },
        },
    },
});

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [open, setOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [search, setSearch] = useState('');
    const [bankDetails, setBankDetails] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const { page, limit, total, changePage, changeLimit, changeTotal } = usePagination();

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/web/retrieve/customers`, {
                params: { limit, page },
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });
            setCustomers(response.data.data.customers);
            setFilteredCustomers(response.data.data.customers);
            changeTotal(response.data.data.count);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setSnackbarMessage('Failed to fetch customers');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [page, limit]);

    useEffect(() => {
        if (search) {
            const filtered = customers.filter(customer => customer.mobile.includes(search));
            setFilteredCustomers(filtered);
        } else {
            setFilteredCustomers(customers);
        }
    }, [search, customers]);

    const handleClickOpen = (customer) => {
        setSelectedCustomer(customer);
        setOpen(true);
    };

    const handleBankDetailsOpen = async (customer) => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/web/retrieve/bank-details`, {
                params: { customerId: customer.id },
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });
            response.data.data && setBankDetails(response.data.data);
            setBankOpen(true);
        } catch (error) {
            console.error('Error fetching bank details:', error);
            setSnackbarMessage('Failed to fetch bank details');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state on close
        setOpen(false);
        setBankOpen(false);
        setSelectedCustomer(null);
        setBankDetails({});
    };

    const handleMenuOpen = (event, customer) => {
        setSelectedCustomer(customer);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSearch = async () => {
        if (!search) return;

        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/web/retrieve/customers`, {
                params: { mobile: search },
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });
            setFilteredCustomers(response.data.data?.customer);
        } catch (error) {
            console.error('Error searching customers:', error);
            setSnackbarMessage(error.response.data.message);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (customerId, currentStatus) => {
        try {
            await axios.put(`${BASE_URL}/api/web/status/customer`, {
                customerId,
                status: !currentStatus
            }, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });

            setFilteredCustomers(prevCustomers =>
                prevCustomers?.map(customer =>
                    customer.id === customerId ? { ...customer, status: !currentStatus } : customer
                )
            );
            setSnackbarMessage('Status updated successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error updating customer status:', error);
            setSnackbarMessage('Failed to update status');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const columns = [
        { field: 'name', headerName: 'Name', flex: 1 },
        {
            field: 'mobile', headerName: 'Mobile', flex: 1, renderCell: (params) => (
                <Button
                    variant="text"
                    color="primary"
                    onClick={() => handleClickOpen(params.row)}
                >
                    {params.value}
                </Button>
            )
        },
        {
            field: 'image', headerName: 'Image', flex: 1, renderCell: (params) => (
                <Avatar src={params.value} alt={params.row.name} />
            )
        },
        { field: 'walletAmount', headerName: 'Wallet Amount', flex: 1 },
        {
            field: 'status', headerName: 'Status', flex: 1, renderCell: (params) => (
                <Switch
                    size="small"
                    color="warning"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    checked={Boolean(params.row.status)}
                    onChange={(event) => { event.stopPropagation(); handleStatusChange(params.row.id, params.row.status) }}
                />
            )
        },
        {
            field: 'actions', headerName: 'Actions', flex: 1, renderCell: (params) => (
                <Box>
                    <IconButton
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleMenuOpen(event, params.row);
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => { handleBankDetailsOpen(selectedCustomer); handleMenuClose(); }}>
                            View Bank Details
                        </MenuItem>
                    </Menu>
                </Box>
            )
        }
    ];

    const rows = filteredCustomers?.map(customer => ({
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        image: customer.image,
        walletAmount: customer.walletAmount,
        status: customer.status,
    }));

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box p={2}>
                <Typography variant={"h4"} my={2} textAlign={"center"} fontWeight={"bold"}>Customers</Typography>

                <Box display="flex" alignItems="center" mb={2}>
                    <TextField
                        label="Search by Mobile Number"
                        variant="outlined"
                        type="number"
                        margin="normal"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginRight: 16 }}
                    />
                    <Button variant="contained" sx={{bgcolor:"#5e4887"}} onClick={handleSearch}>
                        Search
                    </Button>
                </Box>
                <Box style={{ height: 450, width: '100%', overflow: 'auto' }} p={2}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: limit, page },
                            },
                        }}
                        paginationMode="server"
                        rowCount={total}
                        pageSize={limit}
                        checkboxSelection
                        onPaginationModelChange={(value) => {
                            if (value.pageSize !== limit) {
                                changeLimit(value.pageSize);
                                return changePage(0);
                            }
                            changePage(value.page);
                            changeLimit(value.pageSize);
                        }}
                        disableSelectionOnClick
                        loading={loading}
                    />
                </Box>
            </Box>

            {/* Snackbar for notifications */}
            <CustomSnackbar
                open={snackbarOpen}
                handleClose={handleSnackbarClose}
                message={snackbarMessage}
                severity={snackbarSeverity}
            />

            {/* Customer Details Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Customer Details</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Name: {selectedCustomer?.name}
                    </DialogContentText>
                    <DialogContentText>
                        Mobile: {selectedCustomer?.mobile}
                    </DialogContentText>
                    <DialogContentText>
                        Wallet Amount: {selectedCustomer?.walletAmount}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bank Details Dialog */}
            <Dialog open={bankOpen} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Bank Details</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Account Holder Name: {bankDetails?.accountHolderName}
                    </DialogContentText>
                    <DialogContentText>
                        Account Number: {bankDetails?.accountNumber}
                    </DialogContentText>
                    <DialogContentText>
                        IFSC Code: {bankDetails?.ifsc}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
};

export default Customer;
