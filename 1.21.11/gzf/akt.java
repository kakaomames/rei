import com.mojang.authlib.GameProfile;
import io.netty.buffer.ByteBuf;

public record akt(GameProfile b) implements aay<ako> {
   public static final aao<ByteBuf, akt> a;

   public akt(GameProfile param1) {
      this.b = $$0;
   }

   public aba<akt> a() {
      return aku.b;
   }

   public void a(ako $$0) {
      $$0.a(this);
   }

   public boolean d() {
      return true;
   }

   public GameProfile b() {
      return this.b;
   }

   static {
      a = aao.a(aam.A, akt::b, akt::new);
   }
}
