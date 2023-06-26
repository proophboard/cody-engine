import {useGetCarList} from "@frontend/queries/fleet-management/use-get-car-list";
import {GetCarList} from "@app/shared/queries/fleet-management/get-car-list";
import {Box, CircularProgress, Typography} from "@mui/material";
import {DataGrid, GridColDef, GridToolbar} from "@mui/x-data-grid";
import {CarDetails} from "@frontend/app/pages/fleet-management/car-details";
import PageLink from "@frontend/app/components/core/PageLink";
import {useEffect} from "react";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";

const CarList = (params: GetCarList) => {
  const query = useGetCarList(params);

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [params]);

  const columns: GridColDef[] = [
    {
      field: "vehicleId",
      headerName: "Vehicle Id",
      flex: 1,
      renderCell: params => <PageLink page={CarDetails} params={params.row}>{params.value}</PageLink>
    },
    {
      headerName: "Car",
      field: "carName",
      valueGetter: row => row.row.brand + ' ' + row.row.model,
      flex: 1
    },
    {
      field: "productionYear",
      headerName: "Production Year",
      flex: 1
    }
  ];

  return (
    <Box component="div">
      <Typography variant="h3" className="sidebar-anchor" sx={{padding: (theme) => theme.spacing(4), paddingLeft: 0}} id="component-fleet-management-car-list">Car List</Typography>
      {query.isLoading && <CircularProgress />}
      {query.isSuccess && <DataGrid
          columns={columns}
          rows={query.data}
          getRowId={row => row.vehicleId} sx={{width: "100%"}}
          slots={{toolbar: GridToolbar}}
          initialState={
            {pagination: {paginationModel: {pageSize: 5}}}
          }
          pageSizeOptions={[5, 10, 25]}
          density="comfortable"
      />}
    </Box>
  );
}

export default CarList;
