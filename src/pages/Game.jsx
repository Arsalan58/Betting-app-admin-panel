import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Dialog, Tooltip } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../costants';
import { useFormik } from 'formik';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DeleteForever from '@mui/icons-material/DeleteForever';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CustomSnackbar from '../component/CustomSnackbar';
import { isNumber } from '@mui/x-data-grid/internals';

const Game = () => {
    const [bids, setBids] = useState([]);
    const [insideNumbers, setInsideNumbers] = useState([]);
    const [outsideNumbers, setOutsideNumbers] = useState([]);
    const [searchParams] = useSearchParams();
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [bidDeclared, setBidDeclared] = useState(false); // New state for declaration status

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const handleCloseSnackbar = () => {
        setError(null);
        setSuccess(null);
    };

    useEffect(() => {
        let intervalId;
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/web/retrieve/bids`, {
                    params: { id: searchParams.get("id") },
                    headers: {
                        Authorization: localStorage.getItem('token'),
                        'ngrok-skip-browser-warning': true,
                    },
                });

                if (response.data.type === "success") {
                    let { bids, inside, outside, finalBidNumber } = response.data.data;
                    // console.log(+finalBidNumber == 0, "--------------")
                    if (finalBidNumber == 0) {
                        finalBidNumber = "0"
                    }
                    if (finalBidNumber) {
                        setBidDeclared(finalBidNumber)
                        clearInterval(intervalId);
                    }
                    // Set bids
                    setBids(bids);

                    // Parse inside and outside numbers from JSON strings
                    const parsedInside = JSON.parse(inside || "[]");
                    const parsedOutside = JSON.parse(outside || "[]");

                    // Update state with inside and outside numbers
                    setInsideNumbers(parsedInside);
                    setOutsideNumbers(parsedOutside);
                }
            } catch (error) {
                console.error('Error fetching bids:', error);
            }
        };

        fetchData();
        intervalId = setInterval(() => {
            fetchData();
        }, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [searchParams]);

    const bidMap = bids?.reduce((acc, bid) => {
        acc[parseInt(bid.number, 10)] = bid.amount;
        return acc;
    }, {});

    const minBidAmount = bids?.length > 0 ? Math.min(...bids.map(bid => bid.amount)) : 0;
    const maxBidAmount = bids?.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
    const minInsideBidAmount = insideNumbers?.length > 0 ? Math.min(...insideNumbers.map(bid => bid.amount)) : 0;
    const minOutsideBidAmount = outsideNumbers?.length > 0 ? Math.min(...outsideNumbers.map(bid => bid.amount)) : 0;

    const rows = Array.from({ length: 99 }, (_, i) => i);;
    const insideOutsideRow = Array.from({ length: 10 }, (_, i) => i);
    const insideBidMap = insideNumbers?.reduce((acc, bid) => {
        acc[parseInt(bid.number, 10)] = bid.amount;
        return acc;
    }, {});
    const outsideBidMap = outsideNumbers?.reduce((acc, bid) => {
        acc[parseInt(bid.number, 10)] = bid.amount;
        return acc;
    }, {});

    const formik = useFormik({
        initialValues: {
            bidNumber: {},
            insideBidNumber: {},
            outsideBidNumber: {},
        },
        onSubmit: values => {
            // console.log(values);
        },
    });

    const handleBidNumberClick = (number) => {
        // console.log(formik.values.bidNumber.number)
        if (bidDeclared) return; // Prevent clicking if bid is declared

        let insideBidNumber = { number: 0, amount: 0 };
        let outsideBidNumber = { number, amount: bidMap[number] || 0 };

        if (number < 10) {
            insideBidNumber = { number: 0, amount: insideBidMap[0] || 0 };
            outsideBidNumber = { number, amount: bidMap[number] || 0 };
        } else {
            const numberStr = number.toString();
            const insideNumber = parseInt(numberStr[0], 10);
            const outsideNumber = parseInt(numberStr[numberStr.length - 1], 10);

            insideBidNumber = { number: insideNumber, amount: insideBidMap[insideNumber] || 0 };
            outsideBidNumber = { number: outsideNumber, amount: outsideBidMap[outsideNumber] || 0 };
        }

        formik.setFieldValue('bidNumber', { number, amount: bidMap[number] || 0 });
        formik.setFieldValue('insideBidNumber', insideBidNumber);
        formik.setFieldValue('outsideBidNumber', outsideBidNumber);

        setSelectedBid({ number, amount: bidMap[number] || 0 });
    };

    const handleConfirm = async () => {
        try {
            const response = await axios.put(`${BASE_URL}/api/web/update/gameResult`, {
                bidNumber: formik.values.bidNumber.number,
                bidAmount: formik.values.bidNumber.amount
            }, {
                params: { id: searchParams.get("id") },
                headers: {
                    Authorization: localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': true,
                },
            });
            if (response.data.type == "error") {
                setError(response.data.message)
            } else {
                setBidDeclared(response.data.data.finalBidNumber); // Set bidDeclared to true on successful declaration
                setSuccess('Bid declared successfully');
            }
            // Close the dialog and reset form or handle success
            setOpenConfirmDialog(false);
            formik.resetForm();
        } catch (error) {
            console.error('Error declaring bid:', error);
        }
    };

    const handleCancel = () => {
        setOpenConfirmDialog(false);
    };

    return (
        <Box padding={3}>

            <Box display="flex" alignItems={"center"} justifyContent={"space-between"} mb={2}>
                <Typography variant="h4" fontFamily={"Alegreya Sans SC, sans-serif"} fontWeight={500}>Bid Numbers</Typography>
                <Typography variant="h4" fontFamily={"Alegreya Sans SC, sans-serif"} display={bidDeclared ? "inline-flex" : "none"} backgroundColor="red" borderRadius={"10px"} color={"white"} p={1} fontWeight={500}>{bidDeclared}</Typography>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: 2,
                }}
            >
                {rows.map(number => (
                    <Box
                        key={number}
                        onClick={() => handleBidNumberClick(number)}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            cursor: bidDeclared ? 'not-allowed' : 'pointer', // Change cursor if bid is declared
                            boxShadow: formik.values.bidNumber.number === number ? '0px 4px 10px rgba(0, 0, 0, 1)' : 'none',
                            backgroundColor: bidDeclared ? '#BEB8D1' : 'inherit', // Change background color if bid is declared
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                padding: 0.5,
                                backgroundColor: bidDeclared ? "gray" : bidMap ? bidMap[number] === minBidAmount ? '#ffa500' : bidMap[number] === maxBidAmount ? 'red' : (formik.values.bidNumber.number === number ? 'green' : '#6f6bb7') : "#6f6bb7",
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                borderTopLeftRadius: '4px',
                                borderTopRightRadius: '4px',
                            }}
                        >
                            <Typography variant="body2">{number}</Typography>
                        </Box>
                        <Box
                            sx={{
                                // backgroundColor: '#eceaf6',
                                width: '100%',
                                height: 30,
                                backgroundColor: bidDeclared ? '#BEB8D1' : '#eceaf6', // Change background color if bid is declared
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderBottomLeftRadius: '4px',
                                borderBottomRightRadius: '4px',
                                color: 'black',
                            }}
                        >
                            <Typography variant="body2" fontWeight={"bold"}>
                                {bidMap ? bidMap[number] !== undefined ? `₹${bidMap[number]}` : '' : ""}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Display Inside Numbers */}
            <Box mt={4}>
                <Typography variant="h4" fontFamily={"Alegreya Sans SC, sans-serif"} fontWeight={500}>Inside Bid Numbers</Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                        gap: 2,
                    }}
                >
                    {insideOutsideRow?.map((number) => (
                        <Box
                            key={number}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '1px solid #ddd',
                                cursor: "not-allowed",
                                borderRadius: 1,
                                boxShadow: formik.values.insideBidNumber.number === number ? '0px 4px 10px rgba(0, 0, 0, 1)' : 'none',
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    paddingY: 1,
                                    backgroundColor: bidDeclared ? "gray" : insideBidMap[number] === minInsideBidAmount ? '#ffa500' : (formik.values.insideBidNumber.number === number ? 'green' : '#6f6bb7'),
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    borderTopLeftRadius: '4px',
                                    borderTopRightRadius: '4px',
                                }}
                            >
                                <Typography variant="body2">{number}</Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 30,
                                    backgroundColor: bidDeclared ? '#BEB8D1' : '#eceaf6', // Change background color if bid is declared
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: '4px',
                                    borderBottomRightRadius: '4px',
                                    color: 'black',
                                }}
                            >
                                <Typography variant="body2" fontWeight={"bold"}>
                                    {insideBidMap ? insideBidMap[number] !== undefined ? `₹${insideBidMap[number]}` : '' : ""}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Display Outside Numbers */}
            <Box mt={4}>
                <Typography variant="h4" fontFamily={"Alegreya Sans SC, sans-serif"} fontWeight={500}>Outside Bid Numbers</Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                        gap: 2,
                    }}
                >
                    {insideOutsideRow.map((number) => (
                        <Box
                            key={number}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '1px solid #ddd',
                                cursor: "not-allowed",
                                borderRadius: 1,
                                boxShadow: formik.values.outsideBidNumber.number === number ? '0px 4px 10px rgba(0, 0, 0, 1)' : 'none',
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    paddingY: 1,
                                    backgroundColor: bidDeclared ? "gray" : outsideBidMap[number] === minOutsideBidAmount ? '#ffa500' : (formik.values.outsideBidNumber.number === number ? 'green' : '#6f6bb7'),
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    borderTopLeftRadius: '4px',
                                    borderTopRightRadius: '4px',
                                }}
                            >
                                <Typography variant="body2">{number}</Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 30,
                                    backgroundColor: bidDeclared ? '#BEB8D1' : '#eceaf6', // Change background color if bid is declared
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: '4px',
                                    borderBottomRightRadius: '4px',
                                    color: 'black',
                                }}
                            >
                                <Typography variant="body2" fontWeight={"bold"}>
                                    {outsideBidMap ? outsideBidMap[number] !== undefined ? outsideBidMap[number] : '' : ""}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
            <Tooltip title={formik.values.bidNumber.number ? "" : bidDeclared ? "" : "Select bid number first"} placement="left-start">

                <Button
                    variant='contained'
                    onClick={() => setOpenConfirmDialog(true)}
                    sx={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        backgroundColor: formik.values.bidNumber.number !== undefined && formik.values.bidNumber.number !== null ? '#604586' : '#BEB8D1',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: formik.values.bidNumber.number !== undefined && formik.values.bidNumber.number !== null ? '#4b356a' : '#BEB8D1',
                        },
                        '&:disabled': {
                            backgroundColor: '#BEB8D1',
                            color: '#FFFFFF',
                        },
                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 'bold',
                    }}
                    disabled={formik.values.bidNumber.number === undefined || formik.values.bidNumber.number === null || bidDeclared} // Updated condition to check for undefined or null
                >
                    Declare Bid
                </Button>
            </Tooltip>

            {/* Confirmation Dialog */}
            <Modal open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
            >
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle sx={{ color: "#636b74" }}>
                        <WarningRoundedIcon />
                        Confirmation
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Typography variant="body1">
                            Are you sure you want to declare the bid number <strong>{selectedBid?.number}</strong> with amount <strong>{selectedBid?.amount}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="danger" onClick={handleCancel} >
                            Cancel
                        </Button>
                        <Button variant="plain" color="neutral" onClick={handleConfirm}>
                            Confirm
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            <CustomSnackbar
                open={!!error || !!success}
                handleClose={handleCloseSnackbar}
                message={error || success}
                severity={error ? "error" : "success"}
            />
        </Box>
    );
};

export default Game;