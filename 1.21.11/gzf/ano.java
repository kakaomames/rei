import com.mojang.authlib.GameProfileRepository;
import com.mojang.authlib.minecraft.MinecraftSessionService;
import com.mojang.authlib.yggdrasil.ServicesKeySet;
import com.mojang.authlib.yggdrasil.ServicesKeyType;
import com.mojang.authlib.yggdrasil.YggdrasilAuthenticationService;
import java.io.File;
import org.jspecify.annotations.Nullable;

public record ano(MinecraftSessionService a, ServicesKeySet b, GameProfileRepository c, bci d, bca e) {
   private static final String f = "usercache.json";

   public ano(MinecraftSessionService param1, ServicesKeySet param2, GameProfileRepository param3, bci param4, bca param5) {
      this.a = $$0;
      this.b = $$1;
      this.c = $$2;
      this.d = $$3;
      this.e = $$4;
   }

   public static ano a(YggdrasilAuthenticationService $$0, File $$1) {
      MinecraftSessionService $$2 = $$0.createMinecraftSessionService();
      GameProfileRepository $$3 = $$0.createProfileRepository();
      bci $$4 = new bbu($$3, new File($$1, "usercache.json"));
      bca $$5 = new bca.a($$2, $$4);
      return new ano($$2, $$0.getServicesKeySet(), $$3, $$4, $$5);
   }

   @Nullable
   public bgw a() {
      return bgw.a(this.b, ServicesKeyType.PROFILE_KEY);
   }

   public boolean b() {
      return !this.b.keys(ServicesKeyType.PROFILE_KEY).isEmpty();
   }

   public MinecraftSessionService c() {
      return this.a;
   }

   public ServicesKeySet d() {
      return this.b;
   }

   public GameProfileRepository e() {
      return this.c;
   }

   public bci f() {
      return this.d;
   }

   public bca g() {
      return this.e;
   }
}
