<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Path of the uploaded cover inside storage/app/public, e.g. "covers/Zk3x....jpg".
            // NULL = no photo; the site then shows the category gradient instead.
            $table->string('cover_path', 255)->nullable()->after('excerpt');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('cover_path');
        });
    }
};
