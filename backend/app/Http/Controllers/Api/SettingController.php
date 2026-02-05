<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function pos()
    {
        $setting = Setting::firstOrCreate(
            ['key' => 'pos'],
            ['value' => ['tax_rate' => 12, 'service_charge_rate' => 0]]
        );

        return new SettingResource($setting);
    }

    public function updatePos(Request $request)
    {
        $data = $request->validate([
            'tax_rate' => ['required', 'numeric', 'min:0'],
            'service_charge_rate' => ['required', 'numeric', 'min:0'],
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => 'pos'],
            ['value' => $data]
        );

        return new SettingResource($setting);
    }
}
