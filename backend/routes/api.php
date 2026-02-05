<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\KdsController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        Route::middleware('role:admin')->group(function () {
            Route::apiResource('users', UserController::class)->except(['destroy', 'show']);
            Route::patch('users/{user}/pin', [UserController::class, 'updatePin']);

            Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
            Route::apiResource('products', ProductController::class)->except(['index', 'show']);
            Route::apiResource('tables', TableController::class)->except(['index', 'show']);

            Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
            Route::get('inventory/stocks', [InventoryController::class, 'stocks']);
            Route::patch('inventory/stocks/{product}', [InventoryController::class, 'updateStock']);
            Route::post('inventory/movements', [InventoryController::class, 'adjust']);
            Route::get('inventory/movements', [InventoryController::class, 'movements']);

            Route::get('reports/daily', [ReportController::class, 'daily']);
            Route::get('reports/sales-by-product', [ReportController::class, 'salesByProduct']);
            Route::get('reports/sales-by-category', [ReportController::class, 'salesByCategory']);
            Route::get('reports/shift', [ReportController::class, 'shift']);

            Route::get('settings/pos', [SettingController::class, 'pos']);
            Route::put('settings/pos', [SettingController::class, 'updatePos']);
        });

        Route::middleware('role:admin|cashier')->group(function () {
            Route::get('categories', [CategoryController::class, 'index']);
            Route::get('categories/{category}', [CategoryController::class, 'show']);
            Route::get('products', [ProductController::class, 'index']);
            Route::get('products/{product}', [ProductController::class, 'show']);
            Route::get('tables', [TableController::class, 'index']);
            Route::get('tables/{table}', [TableController::class, 'show']);

            Route::get('orders', [OrderController::class, 'index']);
            Route::post('orders', [OrderController::class, 'store']);
            Route::get('orders/{order}', [OrderController::class, 'show']);
            Route::patch('orders/{order}', [OrderController::class, 'update']);
            Route::post('orders/{order}/hold', [OrderController::class, 'hold']);
            Route::post('orders/{order}/resume', [OrderController::class, 'resume']);
            Route::post('orders/{order}/confirm', [OrderController::class, 'confirm']);
            Route::post('orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
            Route::post('orders/{order}/void', [OrderController::class, 'cancel']);
            Route::post('orders/{order}/payments', [OrderController::class, 'addPayment']);
            Route::get('orders/{order}/payments', [OrderController::class, 'payments']);

            Route::post('shifts/open', [ShiftController::class, 'open']);
            Route::post('shifts/close', [ShiftController::class, 'close']);
            Route::get('shifts/{shift}', [ShiftController::class, 'show']);

            Route::get('settings/pos', [SettingController::class, 'pos']);
        });

        Route::middleware('role:admin|kitchen')->group(function () {
            Route::get('kds/orders', [KdsController::class, 'index']);
            Route::patch('kds/orders/{order}/status', [KdsController::class, 'updateStatus']);
        });
    });
});
