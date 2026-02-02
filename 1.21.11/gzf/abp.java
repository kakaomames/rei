import io.netty.buffer.ByteBuf;
import java.util.List;

public record abp(List<anl.c> b) implements aay<abg> {
   public static final aao<ByteBuf, abp> a;

   public abp(List<anl.c> param1) {
      this.b = $$0;
   }

   public aba<abp> a() {
      return abu.i;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public List<anl.c> b() {
      return this.b;
   }

   static {
      a = aao.a(anl.c, abp::b, abp::new);
   }
}
